SnapShare Photo App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing app where users upload photos and view photos from people they follow. As more people join the app, the system needs to handle more uploads, feed requests, and storage.

For this assignment, I will use the following assumptions:

- The app has 10 million registered users.
- 10% of registered users are active each day.
- Each active user uploads one photo per day.
- Each active user views 50 feed pages per day.
- The average original photo is 2 MB.
- Each photo also has a 50 KB thumbnail.
- One day is assumed to have 100,000 seconds.
- One year has 365 days.
- Peak traffic is five times the average traffic.
- Storage estimates include original photos and thumbnails but exclude backups and other system data.

### Calculating daily active users

Daily active users are calculated by taking 10% of the total registered users.

10,000,000 × 10% = 1,000,000

Therefore, SnapShare has **1 million daily active users**.

## 2. Calculating uploads, feed views, and storage

### A. Uploads per second

Each active user uploads one photo per day.

Daily uploads:

1,000,000 × 1 = 1,000,000 photos.

To find the average uploads per second, I divide the daily uploads by 100,000 seconds.

1,000,000 ÷ 100,000 = 10

**Average uploads = 10 photos per second**

For peak traffic, I multiply the average by five.

10 × 5 = 50

**Peak uploads = 50 photos per second**

### B. Feed views per second

Each active user views 50 feed pages per day.

Daily feed views:

1,000,000 × 50 = 50,000,000 feed views.

Average feed views per second:

50,000,000 ÷ 100,000 = 500

**Average feed views = 500 per second**

Peak feed views per second:

500 × 5 = 2,500

**Peak feed views = 2,500 per second**

### C. Photo storage per year

Each original photo takes up 2 MB, and its thumbnail takes up 50 KB, which is approximately 0.05 MB.

Total storage per photo:

2 MB + 0.05 MB = 2.05 MB.

Daily storage:

1,000,000 × 2.05 MB = 2,050,000 MB = 2.05 TB.

Yearly storage:

2.05 TB × 365 = 748.25 TB.

Therefore, SnapShare needs approximately **748.25 TB of additional storage per year** for original photos and thumbnails.

This assumes that users continue uploading one photo per day at the same rate throughout the year.

### Summary of calculations

| Metric | Estimate |
|---|---:|
| Registered users | 10 million |
| Daily active users | 1 million |
| Daily uploads | 1 million |
| Average uploads per second | 10 |
| Peak uploads per second | 50 |
| Daily feed views | 50 million |
| Average feed views per second | 500 |
| Peak feed views per second | 2,500 |
| Daily photo storage | 2.05 TB |
| Yearly photo storage | 748.25 TB |

## 3. Is SnapShare read-heavy or write-heavy?

SnapShare is a **read-heavy system** because users view many more feed pages than the number of photos they upload.

Each active user uploads one photo but views 50 feed pages per day. This means there are about 50 feed views for every upload.

Because of this, I would focus on making feeds load quickly. I would use caching to reduce repeated database queries, a CDN to deliver images faster, and a read replica to handle some database read requests.

These measures help the app handle many users browsing at the same time without putting too much pressure on the main database.

## 4. Why photos should not be stored in the database

I would not store actual photo files inside the database because photos are large and would quickly use up a lot of storage. This could also make database backups slower and affect performance.

Instead, I would store original photos and thumbnails in object storage, such as Amazon S3 or a similar cloud storage service.

The database would store details about each photo, such as the photo ID, owner, caption, upload date, and the storage key used to locate the image. This keeps the database smaller and allows image files to be managed separately.

## 5. Architecture diagram

```text
                         USERS
                           |
                           v
                      +---------+
                      |   CDN   |
                      |  Photos |
                      +---------+
                           |
                           v
                    +---------------+
                    | Load Balancer |
                    +---------------+
                           |
              +------------+------------+
              |            |            |
              v            v            v
          +--------+   +--------+   +--------+
          |  App   |   |  App   |   |  App   |
          | Server |   | Server |   | Server |
          +--------+   +--------+   +--------+
              |            |
              +------+-----+
                     |
              +------+------+
              |             |
              v             v
          +--------+   +-----------+
          | Redis  |   |  Primary  |
          | Cache  |   | Database  |
          +--------+   +-----------+
                           |
                           | Replication
                           v
                      +-----------+
                      | Read      |
                      | Replica   |
                      +-----------+

              PHOTO UPLOAD PROCESS

                   App Server
                       |
                       v
                +--------------+
                | Object       |
                | Storage      |
                | Original     |
                +--------------+
                       |
                       v
                  +---------+
                  |  Queue  |
                  | Jobs    |
                  +---------+
                       |
                       v
                  +---------+
                  |Thumbnail|
                  | Worker  |
                  +---------+
                       |
                       v
                +--------------+
                | Object       |
                | Storage      |
                | Thumbnail    |
                +--------------+

      Database stores photo details and storage keys.
      CDN delivers images to users.
```

## 6. What each component does

1. **CDN:** Delivers photos and thumbnails from servers closer to users, making images load faster.

2. **Load balancer:** Distributes incoming requests across available app servers so that one server does not handle all the traffic.

3. **App servers:** Handle user login, photo uploads, feed requests, and the main application logic.

4. **Redis cache:** Temporarily stores frequently requested feed information so that the database does not have to process the same queries repeatedly.

5. **Primary database:** Stores user accounts, follow relationships, and photo metadata, and handles database updates.

6. **Read replica:** Handles some read requests, reducing the workload on the primary database.

7. **Object storage:** Stores the original photos and thumbnails separately from the database.

8. **Queue:** Holds thumbnail-generation jobs until a worker is ready to process them.

9. **Thumbnail worker:** Takes jobs from the queue, creates smaller versions of photos, and saves the thumbnails in object storage.

## 7. Step-by-step photo upload process

1. The user selects a photo and uploads it through the SnapShare app.

2. The load balancer sends the request to an available app server.

3. The app server checks the user's login status and validates the photo's file type and size.

4. The original photo is uploaded to object storage and assigned a unique storage key.

5. The app server saves the photo's details in the database, including the owner, caption, upload date, and storage key.

6. The app server sends a thumbnail-generation job to the queue so the image can be processed in the background.

7. The app informs the user that the photo has been uploaded successfully, without waiting for thumbnail generation to finish.

8. The thumbnail worker retrieves the job from the queue and reads the original photo from object storage.

9. The worker creates a smaller thumbnail and saves it in object storage. It then updates the database with the thumbnail's storage key or processing status.

10. The feed service retrieves the photo details, and the CDN delivers the appropriate image when users view their feeds.

If thumbnail generation fails, the job can be retried. Jobs that continue to fail can be moved to a dead-letter queue for further investigation.

## 8. Trade-offs

### Trade-off 1: Caching versus fresh data

Caching makes feeds faster and reduces database workload. However, cached information may not immediately reflect a new upload or a change in who a user follows.

I would use cache expiration and update or invalidate relevant cached data when changes happen. A short delay in showing a new post may be acceptable, but private photos must always remain protected.

### Trade-off 2: Background processing versus immediate results

Using a queue and a thumbnail worker allows uploads to finish without waiting for image processing. However, thumbnails may take a short time to become available.

I would choose background processing because it makes uploads faster and separates image processing from the main application. The app can show a placeholder until the thumbnail is ready.

### Trade-off 3: Read replicas versus up-to-date data

A read replica helps the system handle many feed requests without overloading the primary database. However, there may be a delay before new database changes appear on the replica.

I would use the replica for normal feed browsing and use the primary database when a user needs to confirm a recent change immediately.

### Trade-off 4: Image quality versus storage costs

Keeping original photos preserves quality, but storing originals and thumbnails requires more storage space.

I would keep the originals in object storage and use thumbnails when displaying feed previews. This reduces the amount of data users download while browsing, while still allowing them to open the full-size photo when needed.

## 9. Conclusion

Based on my calculations, SnapShare has one million daily active users, receives one million photo uploads per day, and handles 50 million feed views per day. It needs approximately 748.25 TB of additional storage each year for original photos and thumbnails.

Since SnapShare is read-heavy, I would use a CDN, caching, multiple app servers, and a database read replica to improve feed performance. I would also use object storage for photos and a queue with a background worker to create thumbnails.

This design provides a practical way to handle increasing numbers of users while keeping the application responsive and managing storage efficiently.
