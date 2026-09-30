import { getFacultyReviewerComponents, getReviewerSubmissions } from './src/app/faculty/actions';

async function test() {
  try {
    const courses = await getFacultyReviewerComponents(1, 'a48895c7-136f-4aa1-b9c0-b6633084171c');
    console.log("courses", courses);
    
    if (courses.length > 0) {
      const subs = await getReviewerSubmissions(courses.map(c => c.component_id));
      console.log("subs", subs);
    }
  } catch (e) {
    console.error("error in test", e);
  }
}
test();
