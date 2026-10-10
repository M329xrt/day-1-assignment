# School Database Design

## 1. Tables

* **Students:** Stores student details, including student ID, name and email.
* **Courses:** Stores course details, including course ID, course name, course code and department ID.
* **Enrolments:** Stores enrolment records, including enrolment ID, student ID, course ID and grade.

## 2. Relationships

* **Students to Enrolments (One-to-Many):** One student can have many enrolments, but each enrolment belongs to one student.
* **Courses to Enrolments (One-to-Many):** One course can have many enrolments, but each enrolment belongs to one course.
* **Students to Courses (Many-to-Many):** One student can enrol in many courses, and one course can have many students.

The **Enrolments** table acts as a join table between Students and Courses. It is needed to connect students to their courses and store details about each enrolment, such as the grade. A unique constraint on `student_id` and `course_id` prevents duplicate enrolments.

## 3. Database Index

I would add an index on `enrolments.student_id` because it makes finding all enrolments belonging to a particular student faster.

```sql
CREATE INDEX idx_enrolments_student_id
ON enrolments(student_id);
```

## 4. SQL or NoSQL?

I would choose SQL for this school system because the data is structured and has clear relationships between students, courses and enrolments. SQL supports primary keys, foreign keys and constraints that help maintain accurate data and prevent duplicate enrolments. It also makes it easy to use JOIN queries to retrieve information, such as the courses a student is taking and the number of students in each course.
