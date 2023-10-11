const config = require('./config.json');
const fs = require('fs');
const { Client, IntentsBitField, IntegrationExpireBehavior } = require('discord.js');
const Discord = require('discord.js');
const { channel } = require('diagnostics_channel');
const client = new Client({intents: [IntentsBitField.Flags.Guilds, IntentsBitField.Flags.GuildMessages, IntentsBitField.Flags.MessageContent, IntentsBitField.Flags.GuildInvites, IntentsBitField.Flags.GuildMembers, IntentsBitField.Flags.GuildPresences, IntentsBitField.Flags.GuildMessageReactions]});
let counts = require(`${__dirname}/storage/counts.json`);
let scores = require(`${__dirname}/storage/scores.json`);
let invites = require(`${__dirname}/storage/invites.json`);

function log(text) {
    let wehook = new Discord.WebhookClient({url: config.webhook});
    let embed = new Discord.EmbedBuilder()
	.setColor(generateEmbedColor())
    .setDescription(text);
    wehook.send({
        embeds: [embed]
    })
}
function backup() {
    let logs = require('./backups/log.json');
    logs.push({
        id: logs.length,
        date: new Date().getTime(),
        counts: JSON.stringify({easy: counts.easy_mode.number, hard: counts.hard_mode.number, premium: counts.premium_mode.number})
    })
    fs.writeFile(`${__dirname}/backups/counts.json`, JSON.stringify(counts, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    fs.writeFile(`${__dirname}/backups/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    fs.writeFile(`${__dirname}/backups/invites.json`, JSON.stringify(invites, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    fs.writeFile(`${__dirname}/backups/login.json`, JSON.stringify(logs, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    log(`Backed Up Counts & Scores (Backup #${logs.length})`)
}
function writeError(e) {
    log('Storage write error occured')
    return console.log(e)
}
function generateEmbedColor() {
    let index = Math.floor(Math.random() * config.colors.length)
    return config.colors[index]
}
function storeKeyCounts(user_id, count) {
    let score = (scores[user_id].easy || 0) + (scores[user_id].hard || 0) + (scores[user_id].premium || 0);
    let keys = scores[user_id].keycounts || [];
    if (score == 1) {
        keys.push({name: '1st Count', count})
    } else if (score == 10) {
        keys.push({name: '10th Count', count})
    } else if (score == 100) {
        keys.push({name: '100th Count', count})
    } else if (score == 200) {
        keys.push({name: '200th Count', count})
    } else if (score == 500) {
        keys.push({name: '500th Count', count})
    } else if (score % 100,000,000 == 0 &&  score >= 100,000,000) {
        keys.push({name: `${score}th Count`, count})
    } else if (score % 10,000,000 == 0 &&  score >= 10,000,000) {
        keys.push({name: `${score}th Count`, count})
    } else if (score % 1,000,000 == 0 &&  score >= 1,000,000) {
        keys.push({name: `${score}th Count`, count})
    } else if (score % 100,000 == 0 &&  score >= 100,000) {
        keys.push({name: `${score}th Count`, count})
    } else if (score % 10,000 == 0 &&  score >= 10,000) {
        keys.push({name: `${score}th Count`, count})
    } else if (score % 1,000 == 0 &&  score >= 1,000) {
        keys.push({name: `${score}th Count`, count})
    }
    fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
}
async function updateLeaderboard(providedType) {
    let type = providedType ?? "easy"
    let data = Object.values(scores).sort((a, b) => b[type] - a[type]).filter((r) => r[type] > 0);

    let map = data.map((r, i) => `\`${i + 1 < 10 ? `0`:``}${i + 1 < 100 ? `0`:``}${i + 1}\` <@${r.id}> ${r[type] || 0}`).slice(0, 120).join('\n')
    let embed = new Discord.EmbedBuilder()
        .setColor(generateEmbedColor())
        .setTitle(`${type.replace('easy', 'Easy Mode').replace('hard', 'Hard Mode').replace('premium', 'Premium Mode').replace('messages', 'Message').replace('invites', 'Invites')} Leaderboard`)
        .setDescription(map);
    let style = Discord.ButtonStyle.Secondary;
    let row = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setCustomId('leaderboard_easy').setLabel('Easy Mode').setStyle(type == 'easy' ? Discord.ButtonStyle.Primary : style))
        .addComponents(new Discord.ButtonBuilder().setCustomId('leaderboard_hard').setLabel('Hard Mode').setStyle(type == 'hard' ? Discord.ButtonStyle.Primary : style))
        .addComponents(new Discord.ButtonBuilder().setCustomId('leaderboard_premium').setLabel('Premium Mode').setStyle(type == 'premium' ? Discord.ButtonStyle.Primary : style));
    let row2 = new Discord.ActionRowBuilder()
        .addComponents(new Discord.ButtonBuilder().setCustomId('leaderboard_messages').setLabel('Messages').setStyle(type == 'messages' ? Discord.ButtonStyle.Primary : style))
        .addComponents(new Discord.ButtonBuilder().setCustomId('leaderboard_invites').setLabel('Invites').setStyle(type == 'invites' ? Discord.ButtonStyle.Primary : style));

    let channel = client.channels.cache.get(config.leaderboard_channel);
    let message = await channel.messages.fetch(channel.lastMessageId)
    if (new Date().getTime() - message.createdAt.getTime() > 3600000) {
        message.delete()
        channel.send({
            embeds: [embed],
            components: [row, row2]
        })
    } else {
        message.edit({
            embeds: [embed],
            components: [row, row2]
        })
    }
}

try {
    client.on("messageCreate", async(message) => {
        if (message.author.id == client.user.id) return;
        if (message.channelId == config.easy_channel) {
            if (message.content == parseInt(counts.easy_mode.number) + 1 && message.author.id != counts.easy_mode.author) {
                counts.easy_mode.author = message.author.id;
                counts.easy_mode.number = parseInt(counts.easy_mode.number) + 1;
                scores[message.author.id] = {
                    id: message.author.id,
                    easy: scores[message.author.id]?.easy + 1 || 1,
                    hard: scores[message.author.id]?.hard || 0,
                    premium: scores[message.author.id]?.premium || 0,
                    messages: scores[message.author.id]?.messages || 0,
                    invites: scores[message.author.id]?.invites || 0,
                    snipes: scores[message.author.id]?.snipes || [],
                    keycounts: scores[message.author.id]?.keycounts || [],
                }

                message.react('934410264424632330');
                updateLeaderboard('easy');
                storeKeyCounts(message.author.id, counts.easy_mode.number);

                let hof = client.channels.cache.get(config.hof_channel);
                let snipe = client.channels.cache.get(config.snipe_channel);
                let score = scores[message.author.id]?.easy
                let count = counts.easy_mode.number
                if  (score == 1) {
                    message.member.roles.add('905924425042518127')//Counter
                } else if (score == 10) {
                    message.member.roles.add('905924588955910266')//Good Counter
                    hof.send(`Hey, **${message.author.username}** you are now an offical counter! Thanks for being a member of our community.`);
                } else if (score == 100) {
                    message.member.roles.add('905924588955910266')//Super Counter
                    hof.send(`Well done **${message.author.username}** for counting 100 times! You have now unlocked <#${config.hard_channel}>`);
                } else if (score == 1000) {
                    message.member.roles.add('905941983741218867')//Mega Counter
                    hof.send(`Congrats **${message.author.username}**, you have counted 1000 times!`);
                }
                if ((count + 5) % 100 == 0) {
                    snipe.send(`<@&${config.easy_ping}> only 5 away from ${count + 5}!`)
                }
                if (count % 100 == 0) {
                    message.member.roles.add(config.sniper_1_role)
                    scores[message.author.id].snipes.push(count)
                    backup()
                }
                if (count % 1000 == 0) {
                    message.member.roles.add(config.sniper_2_role)
                }
                if (count % 10000 == 0) {
                    message.member.roles.add(config.sniper_3_role)
                }
                fs.writeFile(`${__dirname}/storage/counts.json`, JSON.stringify(counts, null, 2), function writeJSON(err) { if (err) return console.log(err) })
                fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
            } else {
                message.delete()
                message.member.roles.add('905932254373634089')//Ruined Counter
            }
        } else if (message.channelId == config.hard_channel) {
            if (message.content == parseInt(counts.hard_mode.number) + 1 && message.author.id != counts.hard_mode.author) {
                counts.hard_mode.author = message.author.id;
                counts.hard_mode.number = parseInt(counts.hard_mode.number) + 1
                scores[message.author.id] = {
                    id: message.author.id,
                    easy: scores[message.author.id]?.easy || 0,
                    hard: scores[message.author.id]?.hard + 1 || 1,
                    premium: scores[message.author.id]?.premium || 0,
                    messages: scores[message.author.id]?.messages || 0,
                    invites: scores[message.author.id]?.invites || 0,
                    snipes: scores[message.author.id]?.snipes || [],
                    keycounts: scores[message.author.id]?.keycounts || [],
                }

                message.react('934410264424632330');
                updateLeaderboard('hard');
                storeKeyCounts(message.author.id, counts.hard_mode.number);

                let snipe = client.channels.cache.get(config.snipe_channel);
                let count = counts.hard_mode.number
                if (count + 5 % 100 == 0) {
                    snipe.send(`<@&${config.hard_ping}> only 5 away from ${count + 5}!`)
                }
                if (count % 100 == 0) {
                    message.member.roles.add(config.sniper_1_role)
                    scores[message.author.id].snipes.push(count)
                    backup()
                }
                if (count % 1000 == 0) {
                    message.member.roles.add(config.sniper_2_role)
                }
                if (count % 10000 == 0) {
                    message.member.roles.add(config.sniper_3_role)
                }
                fs.writeFile(`${__dirname}/storage/counts.json`, JSON.stringify(counts, null, 2), function writeJSON(err) { if (err) return console.log(err) })
                fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
            } else {
                message.delete()
                message.member.roles.add('905932254373634089')//Ruined Counter
                counts.hard_mode.author = message.author.id;
                counts.hard_mode.number = 0
                message.channel.send({
                    content: `**${message.author.username}#${message.author.discriminator}** messed up! The count has been reset to 0`
                })
                fs.writeFile('./counts.json', JSON.stringify(counts, null, 2), function writeJSON(err) { if (err) return console.log(err) })
            }
        } else if (message.channelId == config.premium_channel) {
            console.log(`${message.content} ${counts.premium_mode.number}`)
            if (message.content == parseInt(counts.premium_mode.number) + 1) {
                counts.premium_mode.author = message.author.id;
                counts.premium_mode.number = parseInt(counts.premium_mode.number) + 1
                scores[message.author.id] = {
                    id: message.author.id,
                    easy: scores[message.author.id]?.easy || 0,
                    hard: scores[message.author.id]?.hard || 0,
                    premium: scores[message.author.id]?.premium + 1 || 1,
                    messages: scores[message.author.id]?.messages || 0,
                    invites: scores[message.author.id]?.invites || 0,
                    snipes: scores[message.author.id]?.snipes || [],
                    keycounts: scores[message.author.id]?.keycounts || [],
                }

                message.react('934410264424632330');
                updateLeaderboard('premium');
                storeKeyCounts(message.author.id, counts.premium_mode.number);

                let snipe = client.channels.cache.get(config.snipe_channel);
                let count = counts.premium_mode.number
                if (count + 5 % 100 == 0) {
                    snipe.send(`<@&${config.premium_ping}> only 5 away from ${count + 5}!`)
                }
                if (count % 100 == 0) {
                    message.member.roles.add(config.sniper_1_role)
                    scores[message.author.id].snipes.push(count)
                    backup()
                }
                if (count % 1000 == 0) {
                    message.member.roles.add(config.sniper_2_role)
                }
                if (count % 10000 == 0) {
                    message.member.roles.add(config.sniper_3_role)
                }
                fs.writeFile(`${__dirname}/storage/counts.json`, JSON.stringify(counts, null, 2), function writeJSON(err) { if (err) return console.log(err) })
                fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
            } else {
                message.delete()
                message.member.roles.add('905932254373634089')//Ruined Counter
            }
        } else {
            if (message.content.startsWith('c!eval') && config.owners.includes(message.author.id)) {
                let code = message.content.split(' ').slice(1).join(' ');
                try {
                    response = await eval(code);
                    
                    let embed = new Discord.EmbedBuilder()
                    .setColor(generateEmbedColor())
                    .addFields(
                        {name: 'Code Input', value: `\`${code}\`` },
                        { name: 'Evaluated Response', value: `\`${response}\`` }
                    )
                    message.channel.send({embeds: [embed]})
                } catch (e) {
                    let stringedError = JSON.stringify(e)
                    if (stringedError.includes('lengthLessThanOrEqual')) {
                        message.channel.send({content: response.toString().slice(0, 2000)})
                    } else {
                        let embed = new Discord.EmbedBuilder()
                    .setColor(generateEmbedColor())
                    .addFields(
                        {name: 'Code Input', value: `\`${code}\`` },
                        { name: 'Error Response', value: `\`${e}\`` }
                    )
                    message.channel.send({embeds: [embed]})
                    }
                }
            } else if (message.content == 'c!score') {
                let score = scores[message.author.id]
                let embed = new Discord.EmbedBuilder()
                    .setColor(generateEmbedColor())
                    .setAuthor({name: 'Your Scores'})
                    .addFields(
                        {name: 'Counting', value: `\`${score.easy || 0}\` easy counts\n> \`${score.hard || 0}\` hard counts\n> \`${score.premium || 0}\` premium counts` , inline: true},
                        {name: 'Messages', value: `\`${score.messages || 0}\` messages`, inline: true},
                        {name: 'Invites', value: `\`${score.invites || 0}\` users invited`, inline: true},
                    )
                message.channel.send({embeds: [embed]})
            } else if (message.content == 'c!count') {
                let easy_user = client.users.cache.get(counts.easy_mode.author)
                let hard_user = client.users.cache.get(counts.hard_mode.author)
                let premium_user = client.users.cache.get(counts.premium_mode.author)
                let embed = new Discord.EmbedBuilder()
                    .setColor(generateEmbedColor())
                    .setAuthor({name: 'Current Count'})
                    .addFields(
                        {name: 'Easy Mode', value: `\`${counts.easy_mode.number || 0}\` (${easy_user?.username || 'Unknown User'})` , inline: true},
                        {name: 'Hard Mode', value: `\`${counts.hard_mode.number|| 0}\` (${hard_user?.username || 'Unknown User'})`, inline: true},
                        {name: 'Premium Mode', value: `\`${counts.premium_mode.number || 0}\` (${premium_user?.username || 'Unknown User'})`, inline: true},
                    )
                message.channel.send({embeds: [embed]})
            }

            scores[message.author.id] = {
                id: message.author.id,
                easy: scores[message.author.id]?.easy || 0,
                hard: scores[message.author.id]?.hard || 0,
                premium: scores[message.author.id]?.premium || 0,
                messages: scores[message.author.id]?.messages + 1|| 1,
                invites: scores[message.author.id]?.invites || 0,
                snipes: scores[message.author.id]?.snipes || [],
                keycounts: scores[message.author.id]?.keycounts || [],
            }
            fs.writeFile('./scores.json', JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
        }
    });

    client.on("interactionCreate", async(interaction) => {
        interaction.reply({content: 'Retrieving Scores...', ephemeral: true})
        if (!interaction.isButton) return;
        switch (interaction.customId) {
            case 'leaderboard_easy':
                updateLeaderboard('easy')
                break;
            case 'leaderboard_hard':
                updateLeaderboard('hard')
                break;
            case 'leaderboard_premium':
                updateLeaderboard('premium')
                break;
            case 'leaderboard_messages':
                updateLeaderboard('messages')
                break;
            case 'leaderboard_invites':
                updateLeaderboard('invites')
                break;
        }
    })

    client.on("guildMemberAdd", async(member) => {
        if (await client.guilds.cache.get('905859582319026287').approximateMemberCount <= 100) {
            member.roles.add("907695456841257002");
        }
        let guild_invites = await client.guilds.cache.get('905859582319026287').invites.fetch();
        let invite = null;
        guild_invites.forEach((inv) => {
            if (inv.uses == invites[inv.code].uses + 1) {
                invite = inv;
            }
        })
        let channel = client.channels.cache.get(config.welcome_channel);
        if (invite != null) {
            invites[invite.code].uses = invite.uses;
            scores[invite.inviterId] = {
                id: invite.inviterId,
                easy: scores[invite.inviterId]?.easy || 0,
                hard: scores[invite.inviterId]?.hard || 0,
                premium: scores[invite.inviterId]?.premium || 0,
                messages: scores[invite.inviterId]?.messages || 0,
                invites: scores[invite.inviterId]?.invites + 1 || 1,
                snipes: scores[message.author.id]?.snipes || [],
                keycounts: scores[message.author.id]?.keycounts || [],
            }
            channel.send(`
    ╭・⌬・Everyone welcome **${member.user.tag}**
    ●▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
    ・Invited by **${invite.inviter.tag}**
    ・${invite.inviter.username} now has ${scores[invite.inviterId].invites} invites!
    ●▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
    ╰・⌬・We now have ${client.guilds.cache.get('905859582319026287').memberCount} members
            `)

            fs.writeFile(`${__dirname}/storage/invites.json`, JSON.stringify(invites, null, 2), function writeJSON(err) { if (err) return console.log(err) })
            fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
        } else {
            channel.send(`
    ╭・⌬・Everyone welcome **${member.user.tag}**
    ●▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
    ・Invited by **Unknown**
    ●▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬●
    ╰・⌬・We now have ${client.guilds.cache.get('905859582319026287').memberCount} members
            `)
        }
    })
    client.on("guildMemberRemove", async(member) => {
        delete scores[member.user.id]
        fs.writeFile(`${__dirname}/storage/scores.json`, JSON.stringify(scores, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    })

    client.on("inviteCreate", async(invite) => {
        log('Invite Created')
        invites[invite.code] = {
            code: invite.code,
            uses: invite.uses,
            user: invite.inviterId,
        }
        fs.writeFile(`${__dirname}/storage/invites.json`, JSON.stringify(invites, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    })
    client.on("inviteDelete", async(invite) => {
        delete invites[invite.code]
        fs.writeFile(`${__dirname}/storage/invites.json`, JSON.stringify(invites, null, 2), function writeJSON(err) { if (err) return console.log(err) })
    })

    client.on("messageReactionAdd", async(reaction, user) => {
        if (reaction.message.id != config.reaction_roles_message) return;
        if (config.reaction_roles[reaction.name]) {
            let member = await client.guilds.cache.get("905859582319026287").members.fetch(user.id);
            member.roles.add(config.reaction_roles[reaction.name]);
        }
    });
    client.on("messageReactionRemove", async(reaction, user) => {
        if (reaction.message.id != config.reaction_roles_message) return;
        if (config.reaction_roles[reaction.name]) {
            let member = await client.guilds.cache.get("905859582319026287").members.fetch(user.id);
            member.roles.remove(config.reaction_roles[reaction.name]);
        }
    });

    client.on("ready", async() => {
        let guild_invites = await client.guilds.cache.get('905859582319026287').invites.fetch();
        guild_invites.forEach((inv) => {
            invites[inv.code] = {
                code: inv.code,
                uses: inv.uses,
                user: inv.inviterId,
            }
        })
        fs.writeFile(`${__dirname}/storage/invites.json`, JSON.stringify(invites, null, 2), function writeJSON(err) { if (err) return console.log(err) })

        backup()
        log(`Bot restarted\nLogged in as ${client.user.tag}\nInvites have been synced`);
    });
} catch (e) {
    console.error(`New Error (${new Date().toLocaleTimeString()} ${new Date().toLocaleDateString()})`);
    console.error(e);
    console.error(`---------------------------------------------------------------------------------`);
    log(JSON.stringify(e, null, 2))
}
client.login(config.token);