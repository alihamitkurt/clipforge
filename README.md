Project name:
- ClipForge

Who are you:
- name: Ali Hamit Kurt
- Computer Engineering student
- Web3 builder
- AI video tools enthusiast
- Stellar blockchain learner
- Hackathon participant
- Creator economy focused developer
- Building tools for editors and content creators

Project details:
- ClipForge is a Web3 video editing marketplace on Stellar.
- Users upload videos, request edits, and set XLM rewards.
- Editors create remixes and the community votes for the best edit.
- Winners can earn rewards through Freighter Wallet.
- The platform also includes an AI Studio where users can plan and render edits with text, memes, audio, and timeline layers.

Vision:
- ClipForge aims to make video editing faster, more collaborative, and more rewarding.
- Instead of creators struggling alone, they can get help from editors, AI tools, and the community.
- It creates a new creator economy where good edits are discovered, voted on, and rewarded transparently through blockchain.
- ClipForge can help small creators, editors, and meme makers turn their creativity into real value.

ChatGPT prompt 1:
Write me a project description, in less than 150 simple, straightforward words, for the following blockchain project details to be implemented on Stellar Blockchain. Describe a complete project:

ClipForge is a Web3 video editing marketplace where users upload raw clips and request creative edits. Editors can submit remix versions of those videos, and the community can vote for the best edit. Video owners can set XLM rewards, and winning editors can receive payments through Freighter Wallet on Stellar. The platform also includes an AI Studio that helps users build edits using timeline layers, text, memes, sound effects, and rendered video previews. ClipForge combines AI tools, community creativity, and blockchain payments to create a fair marketplace for digital video editing.

ChatGPT prompt 2:
Now, also write a vision statement, in 100 simple, straightforward words, for this project. Talk about how this project can create a big impact. Here are my notes:

ClipForge’s vision is to create a new creative economy for video editors and content creators. Many people have good video ideas but do not know how to edit them. Many editors have talent but struggle to find paid work. ClipForge connects both sides in one platform. With Stellar payments, rewards become fast, transparent, and global. With AI Studio, editing becomes easier for beginners. In the future, ClipForge can become a Web3 marketplace where creators, editors, meme makers, and AI tools work together to produce viral content and share value fairly.

ChatGPT prompt 3:
Now, write me a software development plan for this project. Please mainly focus on the smart contract functions, variables, features to be developed. Then, mention the front-end development as well. It should have less than 6 steps in total. Final step can be deployment.

1. Smart Contract Reward System:
Create a Stellar/Soroban contract to store edit contests, video owners, reward amounts, editor addresses, and payment status.

2. Contest and Submission Logic:
Add functions to create an edit request, submit an edit, store edit metadata, and connect each edit to a video.

3. Voting and Winner Logic:
Add voting functions, prevent duplicate votes, calculate the winning edit, and lock the winner after the contest ends.

4. Payment Logic:
Add reward release logic so the video owner can pay the winning editor with XLM after the winner is selected.

5. Front-End Development:
Build the Next.js interface with video upload, AI Studio, remix submission, voting, leaderboard, profile, and Freighter Wallet connection.

6. Deployment:
Deploy the smart contract to Stellar testnet and deploy the web app publicly using Vercel.

ChatGPT prompt 4:
Now, write a personal story summary in less than 100 words. here are my notes:

I built ClipForge because I noticed that viral videos usually become popular because of creative edits, memes, timing, and sound effects. Many people have good clips, but they do not know how to edit them well. At the same time, many editors can create amazing content but do not always have a marketplace to earn from their skills. As a computer engineering student and Web3 hackathon participant, I wanted to build a platform where creators, editors, AI, and blockchain rewards come together.

ChatGPT prompt 5:
Can you also write a draft github readme on how to install the project?

# ClipForge

ClipForge is a Web3 AI-powered video editing marketplace built on Stellar. Users can upload videos, request edits, submit remixes, vote for the best edit, and reward winning editors with XLM through Freighter Wallet.

## Features

- Video upload with Supabase Storage
- Remix/edit submission system
- Like and voting system
- Leaderboard and profile pages
- Freighter Wallet connection
- Stellar testnet payment flow
- AI Studio for timeline-based editing
- Meme, text, audio, and video layer support

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Zustand
- Supabase
- Stellar SDK
- Freighter Wallet
- Gemini API

## Installation

```bash
git clone https://github.com/alihamitkurt/ClipForge.git
cd ClipForge/clipforge-app
npm install
npm run dev
transaction = 6LWTZGQJ7KtKDVxmtJFBEDH4SYXjz22KG+pbWSu/Tjp4KsMzar+HpZJCgFwGrpdfBluQvGxbRE5R3I7oTSV8DA==
