import { SupabaseClient } from "@supabase/supabase-js";
import { UserStudyType } from "@/types/types";

export const updateStudyStreak = async (supabase: SupabaseClient, userId: string): Promise<void> => {
  try {
    const { data: profileData, error: profileFetchError } = await supabase.from("user_profiles").select("last_study_date, study_streak").eq("id", userId).single();

    if (profileFetchError) {
      console.error("Error fetching profile data:", profileFetchError);
      return;
    }

    if (!profileData) {
      console.error("No profile data found");
      return;
    }

    const typedProfileData = profileData as UserStudyType;
    const lastStudyDate = typedProfileData.last_study_date ? new Date(typedProfileData.last_study_date) : null;
    const now = new Date();

    // Check if last_study_date is today
    const isToday = lastStudyDate && lastStudyDate.getFullYear() === now.getFullYear() && lastStudyDate.getMonth() === now.getMonth() && lastStudyDate.getDate() === now.getDate();

    if (!isToday) {
      let newStreak = 1; // Default to 1 for new study session

      if (lastStudyDate) {
        // Create date objects for comparison (without time)
        const lastStudyDateOnly = new Date(lastStudyDate.getFullYear(), lastStudyDate.getMonth(), lastStudyDate.getDate());
        const todayOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Calculate the difference in days
        const timeDifference = todayOnly.getTime() - lastStudyDateOnly.getTime();
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        if (daysDifference === 1) {
          // Consecutive day - continue the streak
          newStreak = (typedProfileData.study_streak || 0) + 1;
        } else if (daysDifference > 1) {
          // Gap in days - reset streak
          newStreak = 1;
        }
        // If daysDifference === 0, this shouldn't happen due to isToday check
        // If daysDifference < 0, something went wrong with dates
      }

      const { error: profileError } = await supabase
        .from("user_profiles")
        .update({
          last_study_date: now.toISOString(),
          study_streak: newStreak,
        })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating last study date and streak:", profileError);
      }
    }
  } catch (error) {
    console.error("Error updating study streak:", error);
  }
};
