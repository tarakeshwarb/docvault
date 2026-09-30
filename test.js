const { getFacultyReviewerComponents, getReviewerSubmissions } = require('./src/app/faculty/actions');
const { getFacultyCourses, getFacultySubmissions } = require('./src/app/faculty/actions');

async function test() {
  try {
    const courses = await getFacultyCourses(1);
    console.log("courses", courses);
  } catch (e) {
    console.error("error in courses", e);
  }
}
test();
