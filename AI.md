# AI Use

Throughout this assignment I collaborated with an AI assistant to develop faster, improve my design, and develop a robust testing suite

## How AI Was Used

### 1. Codebase Exploration & Analysis
I have not worked with Fastify or Passport before. The AI tools were very useful to help me understand what both repos were doing and why fastify-passport needed to exist. I learned that Passport was created years ago to work alongside Express using a callback based architecture. And although Express less  today, Passport continues to thrive with new frameworks like Fastify that use a more modern promise based architecture. Fastify-passport exists to bridge that gap from legacy Express architecture to modern fastify.

### 2. Architectural Brainstorming
I discussed various directions we could take the project with the AI tool. I honestly probably spent most of my time going back and forth with the AI in the types.ts file before writing any execution logic. It was incredibly helpful to bounce ideas off of and to lookup certain properties or conventions already existed in the legacy Passport code so we could reuse them or stay consistent. Once I was confident with the types.ts the rest of the application was easier and fit together nicely.

### 3. AI as a reviewer
As development went, I used a second AI to review the code to catch any edge cases that I may have missed in my own review
- **Object.assign vs Object.create:** The original implementation used Object.assign on review by the AI reviewer it caught that this was going to cause errors. We then wrote a test to confirm and found that it was true. It's something that we would've caught anyway in testing but it's great to catch that as soon as possible.
- **Timing Accuracy:** The AI pointed out that we should use `performance.now()` instead of `Date.now()` for more accurate metrics on performance.
- **Empty strategy array:** The AI reviewer found that even if the stragey array was empty we passed the array along which would confusinly return empty data. We cleaned that up by returning early and giving a more explicit message that the array was empty.

### 4. Test Generation & Validation
I used the AI to help write the unit tests. It was great at identifying edge cases and it helped make an extremly robust testing suite. The AI reviewer even pointed out that one of the tests didn't accurately test that `AuthContext` wasn't being shared across requests. Before the two requests were run together but since they return immdiately there really wasn't any time for the 2nd request to overwrite the firsts context. It gave the good advice to have the first one wait a little bit for the 2nd one to finish and then check if the 1st requests `AuthContext` was corrupted by the 2nds or if it is what we expected it to be.

### 5. What I didn't use AI for (mostly)
I didn't use AI for this file or the DESIGN.md. In a real setting I would probably use AI to speed up drafting a design or requirements doc before reviewing and editting it. But since this project was to go over my competency I thought it was important that all of this was my own words. I used AI to check my grammar and help with some of the flow but for the most part this came from me.