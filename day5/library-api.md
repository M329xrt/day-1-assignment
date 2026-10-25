# Library Books REST API

A REST API for managing books in a library.

## Endpoints

### 1. List all books

* **Method:** `GET`
* **Path:** `/books`
* **Description:** Returns a list of all books.
* **Success:** `200 OK`

### 2. Get one book

* **Method:** `GET`
* **Path:** `/books/:id`
* **Description:** Returns one book using its ID.
* **Success:** `200 OK`

### 3. Create a book

* **Method:** `POST`
* **Path:** `/books`
* **Description:** Adds a new book to the library.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

* **Success:** `201 Created`

### 4. Update a book

* **Method:** `PUT`
* **Path:** `/books/:id`
* **Description:** Updates an existing book.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

* **Success:** `200 OK`

### 5. Delete a book

* **Method:** `DELETE`
* **Path:** `/books/:id`
* **Description:** Deletes a book using its ID.
* **Success:** `204 No Content`

### 6. List books by author

* **Method:** `GET`
* **Path:** `/books?author=Chinua%20Achebe`
* **Description:** Returns books written by the specified author.
* **Success:** `200 OK`

## Error Codes

### 400 Bad Request

The request contains invalid or missing data.

**Example:** Creating a book without providing a title or author.

### 404 Not Found

The requested book does not exist.

**Example:** `GET /books/999` when book ID `999` is not in the library.
