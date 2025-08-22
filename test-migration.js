// Simple test script to trigger migration for existing user
// Run this in browser console or as a Node.js script

const testMigration = async () => {
  try {
    // Replace with your actual user UID from the database
    const userUid = "tBMJdxa3enQTxyc4xqTQkZMsPXB2"; // Your UID from the screenshot
    
    const response = await fetch('/api/users/migrate-to-org', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userUid }),
    });
    
    const result = await response.json();
    console.log('Migration result:', result);
    
    if (result.needsOnboarding) {
      console.log('✅ User profile removed. Refresh the page to trigger onboarding.');
    } else {
      console.log('✅ User migrated to organization structure.');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// Call the function
testMigration();