let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" }
];
function searchNotes(searchTerm) {
  return notes.filter(note =>
    note.text.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

 function longestNote(notes) {
  if (notes.length === 0) {
    return null;
  }

  
  let longest = notes[0];

  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }

  return longest;

}

function countByCategory(notes) {
  let counts = {};

  for (let note of notes) {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  }

  return counts;
}

console.log(countByCategory(notes));
// Expected output: { personal: 2, study: 2, work: 1 }

console.log(countByCategory([]));
// expected output: {}
  function getSummary(notes) {
  let counts = countByCategory(notes);
  let total = notes.length;

  let word = total === 1 ? "note" : "notes";

  return `You have ${total} ${word}. Categories: ${JSON.stringify(counts)}`;
}

console.log(getSummary(notes));
// Expected: You have 5 notes
//  Categories: {"personal":2,"study":2,"work":1}

console.log(getSummary([]));
// Expected: You have 0 notes 
// Categories: {}

function isDuplicate(notes, text) {
  return notes.some(note =>
    note.text.trim().toLowerCase() === text.trim().toLowerCase()
  );
}

console.log(isDuplicate(notes, "  CALL MUM  "));
// expected outpit: true

console.log(isDuplicate(notes, "Go shopping"));
// expected: false

function addNote(notes, text, category) {
  if (isDuplicate(notes, text)) {
    return "Duplicate note";
  }

  if (text.trim().length === 0) {
    return "Note cannot be empty";
  }

  if (text.trim().length < 3) {
    return "Note must be at least 3 characters";
  }

  if (!["personal", "study", "work"].includes(category)) {
    return "Invalid category";
  }

  let newNote = {
    id: notes.length > 0
      ? Math.max(...notes.map(note => note.id)) + 1
      : 1,
    text: text.trim(),
    category: category
  };

  notes.push(newNote);

  return newNote;
}

console.log(addNote(notes, "Complete my homework", "study"));
// expected: { id: 6, text: "Complete my homework", category: "study" }

console.log(addNote(notes, "CALL MUM", "personal"));
// expected output: Duplicate note