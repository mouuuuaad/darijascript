'use server';

import prisma from '@/lib/prisma'; // Correct import path for Prisma client
import { v4 as uuidv4 } from 'uuid';
import { add } from 'date-fns';

export async function createInvitation(email: string) {
  const token = uuidv4();
  // Set expiration, e.g., 7 days from now
  const expiresAt = add(new Date(), { days: 7 });

  try {
    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });
    console.log(`Invitation created for ${email} with token ${token}`);
    return invitation;
  } catch (error) {
    console.error('Error creating invitation:', error);
    // Re-throw or handle as appropriate for your application
    throw new Error('Failed to create invitation.');
  }
}

export async function getInvitationByToken(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: {
        token,
      },
    });
    // Optionally check if the invitation has expired or already been accepted
    if (invitation && new Date() > invitation.expiresAt) {
       console.warn(`Invitation with token ${token} has expired.`);
       // Consider returning null or a specific status/error
       return null; // Example: treat expired as not found
    }
     if (invitation && invitation.accepted) {
         console.warn(`Invitation with token ${token} has already been accepted.`);
         // Handle already accepted case
         return null; // Example: treat accepted as not found for reuse purposes
     }
    return invitation;
  } catch (error) {
    console.error('Error getting invitation by token:', error);
    throw new Error('Failed to retrieve invitation.');
  }
}

export async function acceptInvitation(token: string) {
    try {
      // First, verify the invitation exists and is valid (not expired, not accepted)
      const existingInvitation = await getInvitationByToken(token);
      if (!existingInvitation) {
          throw new Error('Invitation not found, expired, or already accepted.');
      }

      // Mark the invitation as accepted
      const updatedInvitation = await prisma.invitation.update({
        where: {
          token: token, // Use the unique token to find the record
        },
        data: {
          accepted: true,
          // Optionally, you might want to clear the token after acceptance
          // to prevent reuse, or handle this differently based on your logic.
          // token: null, // Example: nullify token after acceptance
        },
      });
      console.log(`Invitation accepted for token ${token}`);
      return updatedInvitation;
    } catch (error) {
      console.error('Error accepting invitation:', error);
       // Check if the error is the one we threw from getInvitationByToken
       if (error instanceof Error && error.message.includes('Invitation not found')) {
           throw error; // Re-throw specific error
       }
      throw new Error('Failed to accept invitation.');
    }
  }

