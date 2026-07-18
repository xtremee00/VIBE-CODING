import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";

dotenv.config();

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY is not configured or holds placeholder. AI will run in simulation mode.");
    return null;
  }
  
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const USERS_FILE = path.join(process.cwd(), "registered_users.json");
  const EMAILS_FILE = path.join(process.cwd(), "sent_emails.json");

  // Helper to read JSON file safely
  async function readJsonFile(filePath: string): Promise<any[]> {
    try {
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const content = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(content || "[]");
    } catch (err) {
      console.error(`Error reading ${filePath}:`, err);
      return [];
    }
  }

  // Helper to write JSON file safely
  async function writeJsonFile(filePath: string, data: any[]): Promise<void> {
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error(`Error writing ${filePath}:`, err);
    }
  }

  // API endpoints
  app.post("/api/admin/register", async (req, res) => {
    try {
      const { id, type, businessName, name, email, phone, role, date, shopCode } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const users = await readJsonFile(USERS_FILE);
      
      // Check if a user with same name/email/businessName already exists in server registry
      const exists = users.some(u => 
        u.name.toLowerCase() === name.toLowerCase() && 
        u.businessName?.toLowerCase() === businessName?.toLowerCase() &&
        (email ? u.email?.toLowerCase() === email.toLowerCase() : true)
      );

      if (!exists) {
        const newUser = {
          id: id || `u-${Date.now()}`,
          type: type || "staff_joined",
          businessName: businessName || "ShopLedger Business",
          name,
          email: email || "",
          phone: phone || "",
          role: role || "salesperson",
          date: date || new Date().toISOString(),
          shopCode: shopCode || ""
        };
        users.push(newUser);
        await writeJsonFile(USERS_FILE, users);
        return res.json({ success: true, message: "User registered successfully on server.", user: newUser });
      }

      return res.json({ success: true, message: "User already exists in server registry." });
    } catch (err: any) {
      console.error("Error in /api/admin/register:", err);
      res.status(500).json({ error: err.message || "Failed to register user on server" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const users = await readJsonFile(USERS_FILE);
      res.json({ success: true, users });
    } catch (err: any) {
      console.error("Error in /api/admin/users:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve registered users" });
    }
  });

  app.get("/api/admin/emails", async (req, res) => {
    try {
      const emails = await readJsonFile(EMAILS_FILE);
      res.json({ success: true, emails });
    } catch (err: any) {
      console.error("Error in /api/admin/emails:", err);
      res.status(500).json({ error: err.message || "Failed to retrieve sent emails" });
    }
  });

  app.post("/api/admin/send-email", async (req, res) => {
    try {
      const { to, subject, body, isHtml } = req.body;
      if (!to || !to.length || !subject || !body) {
        return res.status(400).json({ error: "Missing required fields (to, subject, body)" });
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@shopledger.com";

      const emails = await readJsonFile(EMAILS_FILE);
      const isSmtpConfigured = !!(smtpHost && smtpPort && smtpUser && smtpPass);

      const toList = Array.isArray(to) ? to : [to];
      const sentDetails: any[] = [];
      let anyRealSuccess = false;
      let errorMsg = "";

      if (isSmtpConfigured) {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: parseInt(smtpPort!),
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: smtpUser,
              pass: smtpPass
            }
          });

          // Send mail
          const info = await transporter.sendMail({
            from: smtpFrom,
            to: toList.join(", "),
            subject: subject,
            [isHtml ? "html" : "text"]: body
          });

          anyRealSuccess = true;
          sentDetails.push({
            id: `e-${Date.now()}`,
            to: toList,
            subject,
            body,
            date: new Date().toISOString(),
            status: "sent",
            info: info.messageId,
            isHtml: !!isHtml
          });
        } catch (mailErr: any) {
          console.error("Nodemailer failed to send, falling back to log:", mailErr);
          errorMsg = mailErr.message || "SMTP Connection Failed";
          
          sentDetails.push({
            id: `e-${Date.now()}`,
            to: toList,
            subject,
            body,
            date: new Date().toISOString(),
            status: "failed_smtp_logged",
            error: errorMsg,
            isHtml: !!isHtml
          });
        }
      } else {
        // Log locally
        sentDetails.push({
          id: `e-${Date.now()}`,
          to: toList,
          subject,
          body,
          date: new Date().toISOString(),
          status: "logged_only",
          info: "Logged to server (SMTP credentials not configured in environment)",
          isHtml: !!isHtml
        });
      }

      // Append to emails list
      emails.push(...sentDetails);
      await writeJsonFile(EMAILS_FILE, emails);

      return res.json({
        success: true,
        sent: anyRealSuccess,
        logged: !anyRealSuccess,
        error: errorMsg || undefined,
        message: anyRealSuccess 
          ? "Emails sent successfully via SMTP!" 
          : "SMTP credentials not configured (or connection failed). The email has been recorded in the delivery queue/log on the server.",
        details: sentDetails
      });

    } catch (err: any) {
      console.error("Error in /api/admin/send-email:", err);
      res.status(500).json({ error: err.message || "Failed to process send email" });
    }
  });

  app.post("/api/gemini/insights", async (req, res) => {
    try {
      const { sales, expenses, products, businessName } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Return a simulation response with helpful instructions
        const totalSalesVal = sales.reduce((sum: number, s: any) => sum + s.totalAmount, 0);
        const totalExpVal = expenses.reduce((sum: number, e: number) => sum + e, 0);
        const profit = totalSalesVal - totalExpVal;

        return res.json({
          monthlySummary: `Hey there! Welcome to ShopLedger premium AI insights for ${businessName || "your shop"}. This is an offline simulation because your GEMINI_API_KEY is not fully configured in your settings. Once configured, Gemini will generate deep custom insights! Based on your current local data, you've recorded ${sales.length} sales totaling ${totalSalesVal} and ${expenses.length} expenses totaling ${totalExpVal}.`,
          predictedLowStock: products.filter((p: any) => p.currentQuantity <= p.lowStockLimit).map((p: any) => p.name).slice(0, 3),
          suggestedFastMoving: products.slice(0, 2).map((p: any) => p.name),
          slowMovingInventory: products.filter((p: any) => p.currentQuantity > p.lowStockLimit * 3).slice(0, 2).map((p: any) => p.name),
          spendingWarning: totalExpVal > totalSalesVal * 0.4 ? "Caution: Your expenses are over 40% of sales today. Review transport and fuel costs." : "Awesome! Your expenses are well within safe thresholds today.",
          weeklyHealthReport: `Hello! Here is your Weekly Business Health Report: Your sales totals are currently ${totalSalesVal}. Your most tracked products are doing well, and you've recorded ${expenses.length} expenses. Restock low stock items to maximize profit. For personalized recommendations, enable your Google Gemini Key!`,
          salesPredictionNextMonth: Math.round(totalSalesVal * 1.15 + 5000),
          isSimulation: true
        });
      }

      // We have a real Gemini Client! Prepare data for prompt
      const summaryPrompt = `
You are the advanced business analyst AI inside "ShopLedger" - a friendly whatsapp-like business tracker for small shop owners (kiosks, minimarts, pharmacies).
Analyse the shop's local ledger data and generate standard friendly responses.
Be warm, conversational, clear, and plain-spoken (no complex accounting jargon).

Shop Name: ${businessName || "My Shop"}

Current Local Ledger Data:
- Products list (count: ${products?.length || 0}):
${(products || []).slice(0, 15).map((p: any) => `- Name: ${p.name}, Cat: ${p.category}, Qty: ${p.currentQuantity}, MinQty: ${p.lowStockLimit}, SellPrice: ${p.sellingPrice}`).join("\n")}

- Sales history (count: ${sales?.length || 0}):
${(sales || []).slice(0, 15).map((s: any) => `- Date: ${s.date}, Items Count: ${s.items?.length}, Total: ${s.totalAmount}, Staff: ${s.salespersonName}, Method: ${s.paymentMethod}`).join("\n")}

- Expenses history (count: ${expenses?.length || 0}):
${(expenses || []).slice(0, 15).map((e: any) => `- Date: ${e.date}, Cat: ${e.category}, Amount: ${e.amount}, Desc: ${e.description}`).join("\n")}

Task: Generate a JSON object containing deep insights:
1. "monthlySummary": A friendly, encouraging 2-3 sentence summary of how the month is looking based on sales and expenses. Speak directly to the business owner.
2. "predictedLowStock": string[] of product names that are low or running out.
3. "suggestedFastMoving": string[] of products that have multiple sales or look popular.
4. "slowMovingInventory": string[] of products that have high quantity but low or no sales.
5. "spendingWarning": A sentence identifying unusual spending or reminding them to manage cost.
6. "weeklyHealthReport": A custom, concise weekly report in plain language (e.g., "Your sales increased by 18% this week. Drinks were your highest-selling category... Consider restocking bottled water within three days.")
7. "salesPredictionNextMonth": A numeric estimate of next month's sales total.

Return output strictly conforming to the requested schema. Use the JSON format.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: summaryPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monthlySummary: { type: Type.STRING },
              predictedLowStock: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedFastMoving: { type: Type.ARRAY, items: { type: Type.STRING } },
              slowMovingInventory: { type: Type.ARRAY, items: { type: Type.STRING } },
              spendingWarning: { type: Type.STRING },
              weeklyHealthReport: { type: Type.STRING },
              salesPredictionNextMonth: { type: Type.NUMBER }
            },
            required: [
              "monthlySummary", 
              "predictedLowStock", 
              "suggestedFastMoving", 
              "slowMovingInventory", 
              "spendingWarning", 
              "weeklyHealthReport", 
              "salesPredictionNextMonth"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini API");
      }

      const parsed = JSON.parse(responseText.trim());
      res.json({ ...parsed, isSimulation: false });

    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI insights" });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ShopLedger server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
