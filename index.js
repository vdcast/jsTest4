const TelegramApi = require('node-telegram-bot-api')
const {gameOptions, againOptions} = require('./options')
const sequelize = require('./db');
const UserModel = require('./models');

const token = '5579772730:AAGqlcg5oy9bfCQC5cSQt4PztKtHljSonoU'

const bot = new TelegramApi(token, {polling: true})

const chats = {}


const startGame = async (chatId) => {
    await bot.sendMessage(chatId, `Now I will think of digit (0-9) and you need to guess it. Good luck! :)`);
    const randomNumber = Math.floor(Math.random() * 10)
    chats[chatId] = randomNumber;
    await bot.sendMessage(chatId, 'Guess the number...', gameOptions);
}

const infoOption = async (chatId, msg, text, chatIdString) => {
    const user = await UserModel.findOne({ where: { chatId: chatIdString } })
    await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
    await bot.sendMessage(chatId, `Your name is ${msg.from.first_name}, user name @${msg.from.username}. Correct answers: ${user.right}. Wrong answers: ${user.wrong}`);
}

const start = async () => {

    try {
        await sequelize.authenticate()
        await sequelize.sync()
		console.log('CONNEcting success DB')
    } catch (e) {
        console.log('faiLED connECTION to DB', e)
    }

    bot.setMyCommands([
        {command: '/start', description: 'Welcome to vdcast bot example :)'},
        {command: '/info', description: 'Get information about user'},
        {command: '/game', description: 'Game "Guess The Number"'},
    ])

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;
		const chatIdString = chatId.toString()

        try {
            if (text === '/start') {


                const [user, created] = await UserModel.findOrCreate({
                    where: { chatId: chatIdString }
                });
                console.log(user.username); // 'sdepold'
                console.log(user.job); // This may or may not be 'Technical Lead JavaScript'
                console.log(created); // The boolean indicating whether this instance was just created
                if (created) {
                    console.log(user.job); // This will certainly be 'Technical Lead JavaScript'
                }


				if (!user.chatId){
//                    
//					await UserModel.create({chatId})
                    await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
					await bot.sendMessage(chatId, 'Welcome to vdcast telegram bot. Nice to meet you! :) Please, pick from the following options and use my powerful skills! ^_^');
                    return bot.sendMessage(chatId, 'Choose /game to play game and check your luck today! Choose /info to get more info.');
				} else {
                    await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
					await bot.sendSticker(chatId, 'https://cdn.tlgrm.app/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/192/1.webp')
					await bot.sendMessage(chatId, 'Welcome to vdcast telegram bot. Nice to meet you! :) Please, pick from the following options and use my powerful skills! ^_^');
                    return bot.sendMessage(chatId, '/game - Play game and check your luck today! :)\n/info - Get more info.');
				}
            }
            if (text === '/info') {
//                const user = await UserModel.findOne({ where: { chatId: chatIdString } })
//                await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
//                return bot.sendMessage(chatId, `Your name is ${msg.from.first_name}, user name @${msg.from.username}. Correct answers: ${user.right}. Wrong answers: ${user.wrong}`);
                return infoOption(chatId, msg, text, chatIdString);
            }
            if (text === '/game') {
                await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
                return startGame(chatId);
            }

            console.log(msg)
			await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
            return bot.sendMessage(chatId, 'I don`t understand you, try again!)');
        } catch (e) {
            await bot.sendMessage(394138933, 'ChatID: ' + chatId + '. Text of message: ' + text)
            return bot.sendMessage(chatId, 'Some error, checkit!) ' + e);
        }

        
    })

    bot.on('callback_query', async msg => {
        const data = msg.data;
        const chatId = msg.message.chat.id;
        bot.sendMessage(394138933, chatId + ' | Chose: ' + data)
        if (data == '/again') {
            return startGame(chatId)
        }
        if (data == '/info') {
            return infoOption(chatId, msg, msg.text, chatId.toString());
        }
        const user = await UserModel.findOne({ where: { chatId: chatId.toString() } })
        if (data == chats[chatId]) {
            user.right += 1;
            await bot.sendMessage(chatId, `You've chosen: ${data}, bot made: ${chats[chatId]}`);
            await bot.sendMessage(chatId, `Conratulations! Your are lucky today :)`, againOptions);
        } else {
            user.wrong += 1;
            await bot.sendMessage(chatId, `You've chosen: ${data}, bot made: ${chats[chatId]}`);
            await bot.sendMessage(chatId, `Missed :(`);  
            await bot.sendMessage(chatId, `Play again to try your luck one more time! :)`, againOptions);
        }
        await user.save();
    })
}

start()