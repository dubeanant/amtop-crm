// Test script to delete a user from MongoDB to trigger onboarding
// Run this in browser console

const deleteUserForTesting = async () => {
  try {
    // Replace with your actual user UID
    const userUid = "tBMJdxa3enQTxyc4xqTQkZMsPXB2";
    
    const response = await fetch(`/api/users/${userUid}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      console.log('✅ User deleted successfully. Refresh the page to trigger onboarding.');
    } else {
      console.log('❌ Failed to delete user:', await response.text());
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Call the function
deleteUserForTesting();