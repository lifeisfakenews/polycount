const { Client, IntentsBitField, IntegrationExpireBehavior } = require('discord.js');
const Discord = require('discord.js');
const express = require("express");
const fs = require('fs');
const web_server = express();
const client = new Client({intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.GuildInvites, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMessageReactions]});
const config = require('./config.json');

client.login(config.token);

function log(text) {
    let wehook = new Discord.WebhookClient({url: config.webhook});
    let embed = new Discord.EmbedBuilder()
	.setColor(generateEmbedColor())
    .setDescription(text);
    wehook.send({
        embeds: [embed]
    })
}
function generateEmbedColor() {
    let index = Math.floor(Math.random() * config.colors.length)
    return config.colors[index]
}

web_server.listen(config.port, () => {
    log(`API restarted\nListening on port \`${config.port}\``);
});
web_server.use(express.json());
web_server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.header('Access-Control-Allow-Credentials', true);
    next();
});

web_server.post("/scores/list", async (req, res) => {
    let type = req.body.type ?? "easy";
    let obj = fs.readFileSync(`${__dirname}/storage/scores.json`, 'utf8');
    let data = Object.values(JSON.parse(obj)).sort((a, b) => b[type] - a[type]);
    let map = await Promise.all(data.map(async(r) => {
        let user
        try {
            user = await client.users.fetch(r.id)
            user.avatar_url = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : user.defaultAvatarURL
        } catch (e) {
            user = {
                username: 'Unknown User',
                discriminator: '0000',
                tag: 'Unknown User#0000',
                avatar_url: config.avatars[Math.floor(Math.random() * config.avatars.length)],
                bot: false,
            }
        }
        return {
            user: {
                username: user.username,
                discriminator: user.discriminator,
                tag: user.tag,
                avatar: user.avatar_url,
                id: user.id,
                bot: user.bot,
            },
            easy: r.easy || 0,
            hard: r.hard || 0,
            premium: r.premium || 0,
            messages: r.messages || 0,
            invites: r.invites || 0,
            snipes: r.snipes || [],
            keycounts: r.keycounts || []
        }
    }))
    return res.status(200).json({data: map})
});
web_server.post("/scores/retrieve", async (req, res) => {
    //if (req.headers.authorization !== config.auth) return res.status(401);
    if (!req.body.user_id) return res.status(400).send("Missing ID");
    let score = require("./storage/scores.json")[req.body.user_id]
    console.log(score);
    let user = await client.users.fetch(req.body.user_id)
    let response = {
        easy: score.easy || 0,
        hard: score.hard || 0,
        premium: score.premium || 0,
        messages: score.messages || 0,
        invites: score.invites || 0,
        user: {
            username: user.username,
            discriminator: user.discriminator,
            tag: user.tag,
            avatar: user.displayAvatarURL(),
            id: user.id
        }
    }
    return res.status(200).send({data: response})
})
web_server.post("/counts/retrieve", async (req, res) => {
    let counts = require("./storage/counts.json")
    let result = {
        easy: counts.easy_mode.number,
        hard: counts.hard_mode.number,
        premium: counts.premium_mode.number,
    }
    return res.status(200).json(result);
})