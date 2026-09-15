import { sql } from '../src/lib/db/client';

async function main() {
  const users = await sql`SELECT id, name, email FROM users ORDER BY id DESC LIMIT 5`;
  const courses = await sql`SELECT id, title FROM courses ORDER BY id ASC LIMIT 5`;
  
  if (users.length > 0 && courses.length > 0) {
    const userId = users[0].id;
    const courseId = courses[0].id;
    
    console.log(`Enrolling user ${userId} to course ${courseId}...`);
    
    await sql`
      INSERT INTO enrollments (user_id, course_id, order_id, status)
      VALUES (${userId}, ${courseId}, 1, 'active')
      ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active'
    `;
    
    console.log("Successfully enrolled!");
  } else {
    console.log("Not enough users or courses to enroll.");
    console.log("Users:", users);
    console.log("Courses:", courses);
  }
}

main().catch(console.error).finally(() => process.exit());
