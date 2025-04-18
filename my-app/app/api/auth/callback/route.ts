// Update the user's last login timestamp
// Use this in the callback route when processing logins
const updateLastLogin = async (userId: string, supabase: any) => {
  try {
    await supabase
      .from('users')
      .update({
        last_login_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    console.log('Updated last login timestamp for user:', userId);
  } catch (err) {
    // Don't fail the login process if this update fails
    console.error('Error updating last login timestamp:', err);
  }
} 