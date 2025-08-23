import type { Express } from "express";

// import and mount your route modules here
import calendar from "./calendar.js";
// import files from "./files.js"; // Temporarily disabled - schema missing
import galleryShop from "./gallery-shop.js";
import websiteWizard from "./website-wizard.js";
// add others as needed

export function registerRoutes(app: Express) {
	app.use("/api/calendar", calendar);
	// app.use("/api/files", files); // Temporarily disabled - schema missing
	app.use("/api/gallery-shop", galleryShop);
	app.use("/api/website-wizard", websiteWizard);
}
