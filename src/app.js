// Load up the Discord library
const Discord = require("discord.js");
// Load up WTP class
const WTPManager = require("./WTP").WTPManager;
const wtp = new WTPManager();

// This is the actual bot
const bot = new Discord.Client();

// Load config.json file
const config = require("./config.json");

let streak = 0;
// config.token contains the bot's token
// config.prefix contains the message prefix

//
// BOT LISTENERS
//

bot.on("ready", () => {
  // Set the bot's activity
  bot.user.setActivity("!wtp to play and !help");
});

const TIME_TO_ANSWER = 30; // In seconds

let currentPokemon = "";
let timeout = null;
let onGoing = false;

const clearGlobals = function() {
  currentPokemon = "";
  onGoing = false;
  globalMessage = null;
  wtp.resetState();
  let streak = 0;
};

let globalMessage;
let revealInterval;

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + chr + str.substr(index + 1);
}

const startQuiz = function() {
  if (globalMessage === null) {
    return;
  }
  wtp
    .pickRandomPokemon()
    .then(poke => {
      let interval = 0;
      globalMessage.channel.send(
        `**WHO'S THAT POKEMON?** (*${TIME_TO_ANSWER} seconds to answer*)`
      );
      let id = parseInt(poke.id) >= 100 ? poke.id : "0" + poke.id;
      id = parseInt(poke.id) >= 10 ? id : "0" + id;

      console.log(id);
      globalMessage.channel.send("", {
        files: [
          `https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png`
        ]
      });
      currentPokemon = poke.name;
      console.log(poke.name);
      let blankName = "⌴".repeat(currentPokemon.length);
      globalMessage.delete().catch(O_o => {});
      let msg;
      let guessMap = null;
      guessMap = new Object();
      let revealed = 0;
      revealInterval = setInterval(async function() {
        let randomReveal;
        while (true) {
          randomReveal = getRandomInt(0, currentPokemon.length);
          if (guessMap[randomReveal] !== true) {
            revealed++;
            break;
          }
        }
        blankName = setCharAt(
          blankName,
          randomReveal,
          currentPokemon[randomReveal]
        );
        if (interval === 0) {
          msg = await globalMessage.channel.send(
            "**HINT: **" + blankName + "!"
          );
          guessMap[randomReveal] = true;
        } else {
          msg.edit("**HINT: **" + blankName + "!");
        }
        interval++;
        if (interval === 10) {
          globalMessage.channel.send(
            "**IT'S " + currentPokemon.toUpperCase() + ", ya dumb bitch!**"
          );
          clearGlobals();
          startQuiz();
          clearInterval(revealInterval);
        }
      }, 3000);
    })
    .catch(o_O => {
      globalMessage.reply("Couldn't pick a random Pokémon :(");
    });
};

bot.on("message", async message => {
  // It's good practice to ignore other bots
  if (message.author.bot) return;

  // See if the message contains the bot's prefix
  if (message.content.indexOf(config.prefix) !== 0) return;

  // Get the arguments of the command
  const args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase();
  globalMessage = message;
  // Execute different behaviours based on the command
  switch (command) {
    case "wtp":
      {
        if (wtp.state.activeQuiz) {
          break;
        }
        console.log("[!wtp] Picking a random Pokemon!");
        startQuiz();
      }
      break;
    case "catch":
      {
        if (!wtp.state.activeQuiz) {
          message.reply("No active quiz. Start one by typing !wtp");
          break;
        }
        if (args.length === 0) {
          message.reply("Please specify a Pokémon to answer the quiz.");
          break;
        }
        console.log("Someone guessed " + args[0]);
        if (wtp.checkPokemon(args[0])) {
          clearInterval(revealInterval);
          streak++;
          if (streak > 2) {
            message.reply(
              "**NICE!** current streak is: " +
                streak +
                "! Hit 100 for special prize!"
            );
          }
          if (streak > 99) {
            message.reply(
              "Message moderator for the special prize with code: Why can't darkrai be spelt darkray"
            );
          }
          console.log(streak);
          message.reply("**YOU WON!** It was " + currentPokemon + "!");
          message.channel.send("Type !wtp to start a new quiz!");
          startQuiz();
        } else {
          message.reply("Wrong Pokémon!");
        }
      }
      break;
    case "stop":
      {
        if (wtp.state.activeQuiz) {
          message.reply("PokemonGuess Stopped!");
          clearGlobals();
          clearInterval(revealInterval);
        }
      }
      break;
    case "skip":
      {
        if (wtp.state.activeQuiz) {
          streak = 0;
          clearInterval(revealInterval);
          message.reply(
            "**YOU SKIPPED!** It was " +
              currentPokemon +
              "! and you're a dumb __*bitch*__."
          );
          message.channel.send("Type !wtp to start a new quiz!");
          startQuiz();
        }
      }
      break;
    case "gericka":
      {
        const complimentArray = [
          "cute",
          "sexy",
          "hot",
          "the best",
          "awesome",
          "beautiful",
          "a dumb bitch",
          "adorable",
          "kind",
          "funny",
          "amazing"
        ];
        const i = getRandomInt(0, 6);
        message.reply(`Gericka is ${complimentArray[i]}`);
      }
      break;
    case "ray":
      {
        message.reply("The one who likes Gericka");
      }
      break;
    case "boba":
      {
        message.reply("The Third wheel");
      }
      break;
    case "help":
      {
        message.reply("No fuck you.");
      }
      break;
  }
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

//
// BOT LOGIN
//
bot.login(config.token);
