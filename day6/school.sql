CREATE TABLE students (
  student_Id int PRIMARY KEY,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE,
 course_id INT NOT NULL
 
 );
 CREATE TABLE courses(
 course_id int PRIMARY KEY,
 course_name CHAR NOT NULL,
 course_code INT NOT NULL,
 department_id TEXT NOT NULL,
 FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE CASCADE
 );
 
CREATE (insert rows)
INSERT INTO courses (course_id, course_name, course_code, department_id)
VALUES
(1, 'BSc Software Engineering', '2167', 30),
(2, 'Information Technology', '2168', 30),
(3, 'Business Management', '2169', 40);
INSERT INTO students (student_id, name, email, course_id)
VALUES
(1234, 'Amina Otieno', 'amina@example.com', 1),
(1235, 'Brian Kamau', 'brian@example.com', 2),
(1236, 'Carol Wanjiku', 'carol@example.com', NULL);
INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
(360, 1234, 1, 85),
(361, 1234, 2, 78),
(362, 1235, 1, 90),
(363, 1235, 3, 72),
(364, 1234, 3, 88);


CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade CHAR,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    UNIQUE (student_id, course_id)
);
 
CREATE TABLE note_tags (
  note_id  INTEGER NOT NULL,
  tag_id   INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),   
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);
SELECT courses.course_name
FROM courses
JOIN enrolments ON courses.course_id = enrolments.course_id
JOIN students ON enrolments.student_id = students.student_id
WHERE students.name = 'Amina Otieno';

SELECT students.student_id, students.name
FROM students
JOIN enrolments ON students.student_id = enrolments.student_id
JOIN courses ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'BSc Software Engineering';

SELECT courses.course_name,
COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments ON courses.course_id = enrolments.course_id
GROUP BY courses.course_id, courses.course_name;


SELECT students.student_id, students.name
FROM students
LEFT JOIN enrolments ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;

UPDATE enrolments
SET grade = 95
WHERE enrolment_id = 360;