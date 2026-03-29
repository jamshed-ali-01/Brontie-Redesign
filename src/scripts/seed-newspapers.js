const { MongoClient } = require('mongodb');
require('dotenv').config();

const newspapers = [
    {
        title: 'Community gifting platform launching at Willow & Wild Café in Maynooth',
        content: `Brontie, a new micro-gifting platform, is officially launching at Willow & Wild Café in Maynooth on Friday, August 29 at 2 PM.\nBrontie enables customers to send small, thoughtful gifts like a coffee or cake to friends, family, or colleagues directly from their phones with no app download required.\nThis initiative blends tech innovation with local community spirit. The recipient can redeem their gift instantly in-store via QR code and Brontie is live in local cafés in Maynooth and Leixlip and is aiming to drive engagement and support for small businesses.`,
        imageUrl: '/images/trust-feature-imag1.jpg',
        imageWidth: 661,
        imageHeight: 441,
        isActive: true,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        title: 'New gift-giving platform positively received by locals after Maynooth launch',
        content: `SIMPLE, straight-forward, appealing to all ages, and a clever way to deliver a kind gesture: this is how new users described the new gift-giving platform known as ‘Brontie,’ which launched for the first time at Willow & Wild in Maynooth on Sunday (31st August).\n\nFounded by Kevin Homer, the concept of Brontie was inspired by the warm, gift-giving culture that Kevin encountered during his time living in South Korea.\n\n“What I found here in Ireland is that you see people here saying, ‘I’ll get you a coffee’ or ‘I’ll get you a pint’ but there’s no concept of doing that until now,” explained Kevin.\n\n“This offers the option where you may not be able to see the person in the short term because everyone is so busy with their lives, but you still want to be in touch with a person.\n\n“It’s not here to replace behaviour, it’s here to amplify the behaviour, and it’s more of a ‘think about me gesture.’\n\n“Parents who are dropping other kids to school might be gifted a Brontie now as a thank you.\n\n“Local people from Maynooth and Leixlip jumped on board because they also want to help local businesses,” Kevin commented.\n\nDavid Ball, aged 74, from Lucan was gifted a Brontie that introduced him to Willow & Wild for the first time, as he had not been to the coffee shop before.\n\n“I got the voucher and initially I’m not very up to date with it,” David told Liffey Champion.\n\nDavid spoke with Kevin, who informed him he had treated him to a drink and a sweet treat at Willow & Wild. He ordered a Cappuccino, an Americano, and a lemon drizzle cake.\n\nWhile David acknowledged that technology was not his forte, he emphasised the simplicity of the Brontie platform, which makes it easy and accessible to people of all ages. “It’s nice to give to somebody because they have no idea about it,” said David.\n\n“It simply arrives, and you realise someone has bought you a coffee and cake. It’s a wonderful concept.\n\n“I have a sense that this will appeal to older people too,” said David.\n\nDavid also said when his older brother too simply arrives, he sees it, and he can just press it, and he gets the coffee in question.\n\n“My wife said I had never been here before and Carmel said to me, ‘you must come back.’ So, this has introduced two new customers,” remarked David.\n\nKate Collins from Willow & Wild is delighted about Brontie’s collaboration with her coffee shop.\n\n“I think it’s a brilliant idea and the minute I found out, I was delighted to get behind it,” she said.\n\n“It’s a thoughtful little gift, and so far, the feedback of people coming in has been great.\n\n“Everything has gotten so expensive, like you could nearly spend €40 on a bouquet of flowers,” added Kate.\n\n“This is more affordable, but you’re still giving the thought to it,” she said.`,
        imageUrl: '/images/trust-feature-imag2.png',
        imageWidth: 661,
        imageHeight: 441,
        isActive: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not defined in .env');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('newspapers');

        // Clear existing
        await collection.deleteMany({});

        // Insert new
        await collection.insertMany(newspapers);

        console.log('Successfully seeded newspapers!');
    } catch (error) {
        console.error('Error seeding newspapers:', error);
    } finally {
        await client.close();
    }
}

seed();
