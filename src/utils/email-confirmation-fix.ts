// Utility to handle email confirmation issues
import { supabase } from '@/db/supabase';

export async function confirmUserEmail(email: string) {
  try {
    // Call the database function to confirm user email
    const { data, error } = await (supabase.rpc as any)('confirm_user_email', {
      user_email: email
    });

    if (error) {
      console.error('Error confirming email:', error);
      return { success: false, error: error.message };
    }

    return { success: data, error: null };
  } catch (error) {
    console.error('Unexpected error confirming email:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function checkUserConfirmation(email: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { exists: false, message: 'User not found' };
      }
      return { exists: false, message: error.message };
    }

    return { exists: true, user: data };
  } catch (error) {
    return { exists: false, message: (error as Error).message };
  }
}

// Development utility to bypass email confirmation
export async function devBypassEmail(email: string, password: string, fullName: string, phone?: string, role: string = 'citizen') {
  console.log('🔧 Development bypass: Attempting direct user creation...');
  console.log('📧 Email:', email);
  console.log('👤 Name:', fullName);
  console.log('🔑 Role:', role);

  try {
    // Step 1: Try to create user with signup
    console.log('📝 Step 1: Creating user account...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || '',
          role: role,
        },
      },
    });

    console.log('📊 Signup response:', { data: signUpData, error: signUpError });

    // Check if user was created even with email error
    const userId = (signUpData as any)?.user?.id;
    if (userId) {
      console.log('✅ User created with ID:', userId);

      // Step 2: Wait a moment for trigger to process, then verify profile
      console.log('📝 Step 2: Waiting for trigger to create profile...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: Check if profile was created by trigger
      try {
        const { error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileCheckError) {
          console.log('⚠️ Profile not found, creating manually...');

          // Create profile manually if trigger failed
          const { error: manualProfileError } = await (supabase
            .from('profiles') as any)
            .upsert({
              id: userId,
              email: email,
              phone: phone || '',
              full_name: fullName,
              role: role,
            }, {
              onConflict: 'id'
            });

          if (manualProfileError) {
            console.error('❌ Manual profile creation failed:', manualProfileError);
            return { success: false, error: `Profile creation failed: ${manualProfileError.message}` };
          }

          console.log('✅ Profile created manually');
        } else {
          console.log('✅ Profile created by trigger');
        }
      } catch (profileErr) {
        console.error('❌ Profile check failed:', profileErr);
        return { success: false, error: `Profile check error: ${(profileErr as Error).message}` };
      }

      // Step 4: Try to sign in immediately
      console.log('📝 Step 3: Testing login...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('❌ Login test failed:', signInError);
        return {
          success: true,
          user: (signUpData as any).user,
          warning: `Account created but login test failed: ${signInError.message}. Try logging in manually.`
        };
      }

      console.log('✅ Full bypass successful!');
      return { success: true, user: signInData.user };
    } else {
      console.error('❌ No user ID returned from signup');
      return { success: false, error: 'No user account was created' };
    }
  } catch (error) {
    console.error('❌ Bypass exception:', error);
    return { success: false, error: `Bypass failed: ${(error as Error).message}` };
  }
}

// Export for console usage in development
if (typeof window !== 'undefined') {
  (window as any).devAuth = {
    confirmEmail: confirmUserEmail,
    checkConfirmation: checkUserConfirmation,
    bypassEmail: devBypassEmail,
  };
  console.log('🔧 Development auth utilities available at window.devAuth');
}
