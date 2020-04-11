// Load up the Discord library
const Discord = require('discord.js');
// Load up WTP class
const WTPManager = require('./WTP').WTPManager;
const wtp = new WTPManager();

// This is the actual bot
const bot = new Discord.Client();

// Load config.json file
const config = require('./config.json');
// config.token contains the bot's token
// config.prefix contains the message prefix

//
// BOT LISTENERS
//

bot.on('ready', () => {
  // Set the bot's activity
  bot.user.setActivity("Type !wtp to play");
});

const TIME_TO_ANSWER = 20; // In seconds

let currentPokemon = "";
let timeout = null;
let onGoing = false;

const clearGlobals = function() {
  currentPokemon = "";
  onGoing = false;
  globalMessage = null;
  wtp.resetState();
  if (timeout !== null)
    clearTimeout(timeout);
}
let globalMessage;

const startQuiz = function() {
  if (!globalMessage) {
    return;
  }
  wtp.pickRandomPokemon()
    .then(poke => {
      //message.reply("I picked " + poke.form.name + "!");
      globalMessage.channel.send("**WHO'S THAT POKEMON?** (*20 seconds to answer*)");
      globalMessage.channel.send("", {
        files: [poke.sprite]
      });
      currentPokemon = poke.form.name;
      globalMessage.delete().catch(O_o=>{});
      // Set a timeout to guess this random pokémon
      timeout = setTimeout(() => {
        globalMessage.channel.send("**IT'S " + currentPokemon.toUpperCase() + "!**");
        startQuiz();
      }, TIME_TO_ANSWER * 1000);
    })
    .catch(o_O => {
      globalMessage.reply("Couldn't pick a random Pokémon :(")
    });
}

bot.on('message', async message => {
  // It's good practice to ignore other bots
  if (message.author.bot) return;

  // See if the message contains the bot's prefix
  if (message.content.indexOf(config.prefix) !== 0) return;

  // Get the arguments of the command
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  globalMessage = message;
  // Execute different behaviours based on the command
  switch (command)
  {
    case 'wtp': {
      if (wtp.state.activeQuiz) {
        break;
      }
      console.log("[!wtp] Picking a random Pokemon!");
      startQuiz();
    }
    break;
    case 'guess': {
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
        message.reply("**YOU WON!** It was " + currentPokemon + "!");
        message.channel.send("Type !wtp to start a new quiz!");
        startQuiz();
      } else {
        message.reply("Wrong Pokémon!");
      }
    }
    break;
    case 'wtp-stop': {
      if (wtp.state.activeQuiz) {
        message.reply("PokemonGuess Stopped!");
        clearGlobals();
      }
    }
    break;
  }
});

//
// BOT LOGIN
//
bot.login("Njk4MzU1Nzg1NzI1NjQwNzQ3.XpEsRA.2RoEiL91hHolHH7-AkxLCkdFqt4");
