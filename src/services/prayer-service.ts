'use server';

import prisma from '@/lib/prisma';

// Fetches all prayers, ordered by submission date (descending)
export async function getPrayers() {
  console.log("prayer-service: Fetching prayers from Prisma...");
  try {
    const prayers = await prisma.prayer.findMany({
      orderBy: {
        submittedAt: 'desc',
      },
    });
    console.log(`prayer-service: Fetched ${prayers.length} prayers successfully.`);
    return prayers;
  } catch (error) {
    console.error('prayer-service: Error fetching prayers:', error);
    // Depending on your error handling strategy, you might want to re-throw the error
    // throw new Error('Failed to fetch prayers.');
    return []; // Return empty array on error for the admin page
  }
}

// Saves a new prayer to the database
export async function savePrayer(text: string) {
   // Basic validation: ensure text is not empty or just whitespace
   if (!text || text.trim().length === 0) {
     console.warn("prayer-service: Attempted to save empty prayer text.");
     // You might want to return an error or specific status code here
     // For now, we'll just prevent saving and return null or throw an error
     throw new Error("Prayer text cannot be empty.");
     // return null;
   }

   console.log(`prayer-service: Saving prayer: "${text}"`);
   try {
     const newPrayer = await prisma.prayer.create({
       data: {
         text: text.trim(),
         // 'submittedAt' will be set to the current timestamp by default (defined in schema)
       },
     });
     console.log(`prayer-service: Prayer saved successfully with ID: ${newPrayer.id}`);
     return newPrayer;
   } catch (error) {
     console.error('prayer-service: Error saving prayer:', error);
     // Re-throw the error to be handled by the caller (e.g., the WelcomeOverlay)
     throw new Error('Failed to save prayer to the database.');
   }
}