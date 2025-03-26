const generateRandomNameWithGender = () => {
  const firstNames = [
    { name: "John", gender: 1 }, 
    { name: "Bob", gender: 1 }, 
    { name: "Eve", gender: 2 },
    { name: "Mars", gender: 1 }, 
    { name: "Mark", gender: 1 }, 
    { name: "Marcus", gender: 1 },
    { name: "Aaron", gender: 1 }, 
    { name: "Jonas", gender: 1 }, 
    { name: "Joshua", gender: 1 },
    { name: "Nash", gender: 1 }, 
    { name: "Joy", gender: 1 }, 
    { name: "Jennie", gender: 1 },
    { name: "Jennifer", gender: 1 }, 
    { name: "Rose", gender: 2 }, 
    { name: "Jane", gender: 2 },
    { name: "Alice", gender: 2 }, 
    { name: "Eli", gender: 2 }, 
    { name: "Nancy", gender: 2 },
    { name: "Oli", gender: 2 }, 
    { name: "Ana", gender: 2 }, 
    { name: "Liam", gender: 1 },
    { name: "Noah", gender: 1 }, 
    { name: "Oliver", gender: 1 }, 
    { name: "Elijah", gender: 1 },
    { name: "James", gender: 1 }, 
    { name: "William", gender: 1 }, 
    { name: "Benjamin", gender: 1 },
    { name: "Lucas", gender: 1 }, 
    { name: "Henry", gender: 1 }, 
    { name: "Alexander", gender: 1 },
    { name: "Charlotte", gender: 2 }, 
    { name: "Amelia", gender: 2 }, 
    { name: "Olivia", gender: 2 },
    { name: "Sophia", gender: 2 }, 
    { name: "Isabella", gender: 2 }, 
    { name: "Mia", gender: 2 },
    { name: "Harper", gender: 2 }, 
    { name: "Evelyn", gender: 2 }, 
    { name: "Abigail", gender: 2 },
    { name: "Ella", gender: 2 }, 
    { name: "Grace", gender: 2 }, 
    { name: "Ethan", gender: 1 },
    { name: "Jacob", gender: 1 }, 
    { name: "Michael", gender: 1 }, 
    { name: "Daniel", gender: 1 },
    { name: "Matthew", gender: 1 }, 
    { name: "Zoe", gender: 2 }, 
    { name: "Lily", gender: 2 },
    { name: "Chloe", gender: 2 }, 
    { name: "Sophie", gender: 2 },
    { name: "Emily", gender: 2 }, 
    { name: "Madison", gender: 2 }, 
    { name: "Victoria", gender: 2 },
    { name: "Scarlett", gender: 2 }, 
    { name: "Luna", gender: 2 }, 
    { name: "Layla", gender: 2 },
    { name: "Riley", gender: 2 }, 
    { name: "Avery", gender: 2 }, 
    { name: "Samantha", gender: 2 },
    { name: "Zachary", gender: 1 }, 
    { name: "Joseph", gender: 1 }, 
    { name: "Andrew", gender: 1 },
    { name: "Sebastian", gender: 1 }, 
    { name: "David", gender: 1 }, 
    { name: "Carter", gender: 1 },
    { name: "Wyatt", gender: 1 }, 
    { name: "Leo", gender: 1 }, 
    { name: "Jack", gender: 1 },
    { name: "Levi", gender: 1 }, 
    { name: "Jackson", gender: 1 }, 
    { name: "Gabriel", gender: 1 },
    { name: "Julian", gender: 1 }, 
    { name: "Mila", gender: 2 }, 
    { name: "Aria", gender: 2 },
    { name: "Ellie", gender: 2 }, 
    { name: "Stella", gender: 2 }, 
    { name: "Aurora", gender: 2 },
    { name: "Camila", gender: 2 }, 
    { name: "Nova", gender: 2 }, 
    
    { name: "Brooklyn", gender: 2 },
    { name: "Hazel", gender: 2 }, { name: "Savannah", gender: 2 }, { name: "Parker", gender: 1 },
    { name: "Isaac", gender: 1 }, { name: "Lincoln", gender: 1 }, { name: "Nathan", gender: 1 },
    { name: "Connor", gender: 1 }, { name: "Joshua", gender: 1 }, { name: "Adrian", gender: 1 },
    { name: "Thomas", gender: 1 }, { name: "Nolan", gender: 1 }, { name: "Adam", gender: 1 },
    { name: "Caroline", gender: 2 }, { name: "Eliana", gender: 2 }, { name: "Penelope", gender: 2 },
    { name: "Addison", gender: 2 }, { name: "Paisley", gender: 2 }, { name: "Aubrey", gender: 2 },
    { name: "Elliana", gender: 2 }, { name: "Leah", gender: 2 }, { name: "Madeline", gender: 2 },
    { name: "Audrey", gender: 2 }, { name: "Elizabeth", gender: 2 }, { name: "Hailey", gender: 2 },
    { name: "Nathaniel", gender: 1 }, { name: "Caleb", gender: 1 }, { name: "Owen", gender: 1 },
    { name: "Dominic", gender: 1 }, { name: "Logan", gender: 1 }, { name: "Hunter", gender: 1 },
    { name: "Austin", gender: 1 }, { name: "Aaron", gender: 1 }, { name: "Bennett", gender: 1 },
    { name: "Christian", gender: 1 }, { name: "Finn", gender: 1 }, { name: "Harrison", gender: 1 },
    { name: "Brooks", gender: 1 }, { name: "Kingston", gender: 1 }, { name: "Micah", gender: 1 },
    { name: "Santiago", gender: 1 }, { name: "Adeline", gender: 2 }, { name: "Nora", gender: 2 },
    { name: "Vivian", gender: 2 }, { name: "Lydia", gender: 2 }, { name: "Claire", gender: 2 },
    { name: "Eloise", gender: 2 }, { name: "Bella", gender: 2 }, { name: "Ruby", gender: 2 },
    { name: "Piper", gender: 2 }, { name: "Willow", gender: 2 }, { name: "Lucy", gender: 2 },
    { name: "Remi", gender: 2 }, { name: "Violet", gender: 2 }, { name: "Rylee", gender: 2 },
    { name: "Eden", gender: 2 }, { name: "Isabelle", gender: 2 }, { name: "Jasmine", gender: 2 },
    { name: "Ivy", gender: 2 }, { name: "Beckett", gender: 1 }, { name: "Ezekiel", gender: 1 },
    { name: "Braxton", gender: 1 }, { name: "Ryker", gender: 1 }, { name: "Cole", gender: 1 },
    { name: "Roman", gender: 1 }, { name: "Asher", gender: 1 }, { name: "Declan", gender: 1 },
    { name: "Ezra", gender: 1 }, { name: "Weston", gender: 1 }, { name: "Grayson", gender: 1 },
    { name: "Maddox", gender: 1 }, { name: "Jason", gender: 1 }, { name: "Silas", gender: 1 },
    { name: "Miles", gender: 1 }, { name: "Xavier", gender: 1 }, { name: "Sawyer", gender: 1 },
    { name: "Zane", gender: 1 }, { name: "Theo", gender: 1 }, { name: "Ryder", gender: 1 },
    { name: "Eliana", gender: 2 }, { name: "Faith", gender: 2 }, { name: "Sarah", gender: 2 },
    { name: "Iris", gender: 2 }, { name: "Jade", gender: 2 }, { name: "Emilia", gender: 2 },
    { name: "Sienna", gender: 2 }, { name: "Hannah", gender: 2 }, { name: "Everly", gender: 2 },
    { name: "Lila", gender: 2 }, { name: "Daisy", gender: 2 }, { name: "Adalyn", gender: 2 },
    { name: "Ariana", gender: 2 }, { name: "Maya", gender: 2 }, { name: "Alexa", gender: 2 },
    { name: "Juliet", gender: 2 }, { name: "Freya", gender: 2 }, { name: "Naomi", gender: 2 },
    { name: "Laila", gender: 2 }, { name: "Melody", gender: 2 }, { name: "Serenity", gender: 2 },
    { name: "Mabel", gender: 2 }, { name: "Lennon", gender: 2 }, { name: "Valentina", gender: 2 },
    { name: "Juniper", gender: 2 }, { name: "Ophelia", gender: 2 }, { name: "Aspen", gender: 2 },
    { name: "Paige", gender: 2 }, { name: "Mackenzie", gender: 2 }, { name: "Gianna", gender: 2 },
    { name: "Sage", gender: 2 }, { name: "Tessa", gender: 2 }, { name: "Camille", gender: 2 },
    { name: "Delilah", gender: 2 }, { name: "Blake", gender: 1 }, { name: "George", gender: 1 },
    { name: "Gavin", gender: 1 }, { name: "Quinn", gender: 1 }, { name: "Grant", gender: 1 },
    { name: "Landon", gender: 1 }, { name: "King", gender: 1 }, { name: "Spencer", gender: 1 },
    { name: "Hayden", gender: 1 }, { name: "Cody", gender: 1 }, { name: "Beau", gender: 1 },
    { name: "Antonio", gender: 1 }, { name: "Kai", gender: 1 }, { name: "Maxwell", gender: 1 },
    { name: "Tyler", gender: 1 }, { name: "Walker", gender: 1 }, { name: "Reed", gender: 1 },
    { name: "Bryce", gender: 1 }, { name: "Dallas", gender: 1 }, { name: "Easton", gender: 1 },
    { name: "Colton", gender: 1 }, { name: "Tucker", gender: 1 }, { name: "Hudson", gender: 1 },
    { name: "Bentley", gender: 1 }, { name: "Camden", gender: 1 }, { name: "Brody", gender: 1 },
    { name: "Jax", gender: 1 }, { name: "Jayce", gender: 1 }, { name: "Jude", gender: 1 },
    { name: "Amelia", gender: 2 },
    { name: "Harper", gender: 2 },
    { name: "Chloe", gender: 2 },
    { name: "Eleanor", gender: 2 },
    { name: "Isla", gender: 2 },
    { name: "Grace", gender: 2 },
    { name: "Eliza", gender: 2 },
    { name: "Molly", gender: 2 },
    { name: "Rose", gender: 2 },
    { name: "Margot", gender: 2 },
    { name: "Florence", gender: 2 },
    { name: "Olive", gender: 2 },
    { name: "Arthur", gender: 1 },
    { name: "Henry", gender: 1 },
    { name: "Ethan", gender: 1 },
    { name: "Liam", gender: 1 },
    { name: "James", gender: 1 },
    { name: "Darna", gender: 1 },
    { name: "Samuel", gender: 1 },
    { name: "Jacob", gender: 1 },
    { name: "Mason", gender: 1 },
    { name: "Elijah", gender: 1 }
    
  ];


  const lastNames = [
    "Doe", "Smith", "Johnson", "Brown", "Lee", "Santos", "Mendez", "Dela Cruz", "Rivera",
    "Nichols", "Roxas", "Villar", "Dizon", "Uy", "Go", "Ombog", "Legaspi", "Samonte",
    "Serapio", "Fernandez", "Anderson", "Clark", "Evans", "Garcia", "Harris", "James",
    "Jones", "Kim", "Martinez", "Moore", "Nguyen", "Ortiz", "Parker", "Peterson", "Ramirez",
    "Roberts", "Scott", "Taylor", "Thomas", "Walker", "White", "Wright", "Young", "Zhang",
    "Adams", "Baker", "Campbell", "Davis", "Edwards", "Foster",
    "Andrews", "Armstrong", "Bailey", "Bennett", "Brooks", "Bryant", "Butler", "Carroll", 
    "Chapman", "Collins", "Cooper", "Cox", "Curtis", "Daniels", "Dawson", "Diaz", 
    "Duncan", "Ellis", "Fisher", "Fleming", "Ford", "Freeman", "Gomez", "Gonzales", 
    "Graham", "Grant", "Griffin", "Gutierrez", "Hamilton", "Harper", "Hawkins", 
    "Hernandez", "Hughes", "Hunter", "Jackson", "Jenkins", "Jordan", "Kelly", 
    "Khan", "King", "Knight", "Lawrence", "Lewis", "Lopez", "Marshall", "Mason", 
    "Mendoza", "Miller", "Mitchell", "Morgan", "Morris", "Murphy", "Murray", 
    "Myers", "Nelson", "Newton", "O’Brien", "Oliver", "Palmer", "Patel", "Perez", 
    "Phillips", "Price", "Reed", "Reyes", "Richardson", "Robinson", "Rodriguez", 
    "Rogers", "Ross", "Russell", "Sanders", "Shaw", "Simpson", "Snyder", "Stephens", 
    "Stewart", "Sullivan", "Terry", "Torres", "Turner", "Vargas", "Vasquez", 
    "Wallace", "Ward", "Watson", "Weaver", "Webb", "Wells", "West", "Williams", 
    "Wilson", "Wood", "Yates", "Allen", "Bishop", "Blake", "Bradley", "Burgess", 
    "Burton", "Carter", "Cunningham", "Euwenn", "Davidson", 
    
    "Douglas", "Doyle", 
    "Edward", "Ferguson", "Franklin", "Gilbert", "Gill", "Griffith", "Hart", 
    "Henderson", "Holland", "Hopkins", "Howard", "Jennings", "Johnston", "Joseph", 
    "Kelley", "Kennedy", "Lam", "Larson", "Lawson", "Leonard", "Little", "Long", 
    "Lowe", "Lyons", "Malone", "Marshallo", "Martin", "Matthews", "McCarthy", 
    "McDonald", "McGee", "McKinney", "Mejia", "Mills", "Montgomery", "Moorei", 
    "Morrison", "Neal", "Tonew", "Norris", "O’Connor", "Owens", "Palmers", 
    "Paterson", "Pena", "Perry", "Peters", "Powell", "Quinn", "Ramos", "Ray", 
    "Reid", "Reys", "Richards", "Rivera", "Romero", "Sampson", "Schneider", 
    "Shepherd", "Smith", "Spencer", "Steele", "Stephenson", "Stevenson", 
    "Sutton", "Swanson", "Tate", "Todd", "Tyler", "Valencia", "Vega", "Vinson", 
    "Wallace", "Walters", "Ward", "Weaver", "Webb", "Whitaker", "Wilkins", 
    "Williams", "Wright", "Yates",
    "Abbott", "Beck", "Carlson", "Chavez", "Decker", "Fleming", "Garner", "Harding", 
    "Ingram", "Lindsey", "Maddox", "Nash"
    
  ];

  const randomFirstNameIndex = Math.floor(Math.random() * firstNames.length);
  const randomLastNameIndex = Math.floor(Math.random() * lastNames.length);

  const firstName = firstNames[randomFirstNameIndex].name;
  const lastName = lastNames[randomLastNameIndex];
  const gender = firstNames[randomFirstNameIndex].gender;

  return {
    firstName,
    lastName,
    gender,
  };
};
let currentIndex = 0;
const generateRandomNameWithGenderForHostProfile = () => {
    const fullname = [
      { userId: 1, firstName: "Hazel", lastName: "Delito", gender: 2 },  
      { userId: 2, firstName: "Jamica", lastName: "Balmores", gender: 2 },
      { userId: 3, firstName: "Lanie", lastName: "Gonzales", gender: 2 },
      { userId: 4, firstName: "Davey", lastName: "De Guzman", gender: 2 },
      { userId: 5, firstName: "Neal", lastName: "Andal", gender: 2 },
      { userId: 6, firstName: "Jenny", lastName: "Martinez", gender: 2 },
      { userId: 7, firstName: "Nicole", lastName: "Legaspi", gender: 2 },
      { userId: 8, firstName: "Omaymah", lastName: "Mateo", gender: 2 },
      { userId: 9, firstName: "Erika", lastName: "Jumalon", gender: 2 },
      { userId: 10, firstName: "Anna", lastName: "Eustaquio", gender: 2 },
      { userId: 11, firstName: "Alexander", lastName: "Medina", gender: 1 },
      { userId: 12, firstName: "Tim", lastName: "Baylon", gender: 1 },
      { userId: 13, firstName: "Mac", lastName: "De Guzman", gender: 1 },
      { userId: 14, firstName: "Geoff", lastName: "Mateo", gender: 1 },
      { userId: 15, firstName: "Jiselle", lastName: "Bonifacio", gender: 2 },
      { userId: 16, firstName: "Martha", lastName: "Javier-Riel", gender: 2 },
      { userId: 17, firstName: "Charmay", lastName: "Soriano", gender: 2 },
      { userId: 18, firstName: "Gerry", lastName: "Mongcopa", gender: 1 },
      { userId: 19, firstName: "Charmaine Joy", lastName: "Molina", gender: 2 }
    ]

    if (currentIndex < fullname.length) {
      return fullname[currentIndex++];
    } else {
      // Reset the index if you reach the end of the array (optional)
      currentIndex = 0; 
      return fullname[currentIndex++];
    }
};

module.exports = {
  generateRandomNameWithGender,
  generateRandomNameWithGenderForHostProfile
}