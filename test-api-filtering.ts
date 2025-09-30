import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testAPIFiltering() {
  console.log('Testing API course filtering...\n');

  // Get all courses from database directly
  const { data: allCourses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, categories');

  if (coursesError) {
    console.log('Error fetching courses:', coursesError);
    return;
  }

  console.log('All courses in database:');
  allCourses.forEach(course => {
    console.log(`- ${course.title}: ${JSON.stringify(course.categories)}`);
  });

  // Get a student user to test filtering
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, email, categories')
    .eq('role', 'student')
    .limit(1);

  if (studentsError || !students || students.length === 0) {
    console.log('Error fetching students:', studentsError);
    return;
  }

  const testStudent = students[0];
  console.log(`\nTesting with student: ${testStudent.email}`);
  console.log(`Student categories: ${JSON.stringify(testStudent.categories)}`);

  // Simulate the filtering logic from filterCoursesByAccess
  const userCategories = new Set(testStudent.categories || []);
  console.log(`User category set: ${Array.from(userCategories)}`);

  const filteredCourses = allCourses.filter(course => {
    const courseCats = course.categories || [];
    if (courseCats.length === 0) return true; // public course

    for (const cat of courseCats) {
      if (userCategories.has(cat)) return true;
    }
    return false;
  });

  console.log('\nFiltered courses for this student:');
  if (filteredCourses.length === 0) {
    console.log('No courses accessible!');
  } else {
    filteredCourses.forEach(course => {
      console.log(`- ${course.title}: ${JSON.stringify(course.categories)}`);
    });
  }

  // Test with specific user ID
  const testUserId = '40bf0f90-de6d-4b2f-95a8-8145a6323bb5';
  const { data: specificUser, error: userError } = await supabase
    .from('users')
    .select('id, email, categories, role')
    .eq('id', testUserId)
    .single();

  if (userError) {
    console.log('Error fetching specific user:', userError);
  } else {
    console.log(`\nSpecific user ${testUserId}:`);
    console.log(`Email: ${specificUser.email}`);
    console.log(`Role: ${specificUser.role}`);
    console.log(`Categories: ${JSON.stringify(specificUser.categories)}`);

    // Test filtering for this user
    const userCategories = new Set(specificUser.categories || []);
    console.log(`User category set: ${Array.from(userCategories)}`);

    const filteredCourses = allCourses.filter(course => {
      const courseCats = course.categories || [];
      if (courseCats.length === 0) return true; // public course

      for (const cat of courseCats) {
        if (userCategories.has(cat)) return true;
      }
      return false;
    });

    console.log('\nFiltered courses for this specific user:');
    if (filteredCourses.length === 0) {
      console.log('No courses accessible!');
    } else {
      filteredCourses.forEach(course => {
        console.log(`- ${course.title}: ${JSON.stringify(course.categories)}`);
      });
    }
    console.log(`Total courses: ${allCourses.length}, Filtered: ${filteredCourses.length}`);
  }
}

testAPIFiltering().catch(console.error);
