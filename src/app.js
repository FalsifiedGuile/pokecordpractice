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

const TIME_TO_ANSWER = 30; // In seconds

let currentPokemon = "";
let timeout = null;
let onGoing = false;

const clearGlobals = function() {
  currentPokemon = "";
  onGoing = false;
  globalMessage = null;
  wtp.resetState();
  clearInterval(revealInterval);
}

let globalMessage;
let revealInterval; 

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

const startQuiz = function() {
  if (globalMessage === null) {
    return;
  }
  wtp.pickRandomPokemon()
    .then(poke => {
      let interval = 0;
      globalMessage.channel.send(`**WHO'S THAT POKEMON?** (*${TIME_TO_ANSWER} seconds to answer*)`);
      let id = parseInt(poke.id) >= 100 ? poke.id : ('0' + poke.id);
      console.log('0'+id);
      globalMessage.channel.send("", {
        files: [`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${id}.png`]
      });
      currentPokemon = poke.form.name;
      console.log(currentPokemon.length);
      let blankName = '⌴'.repeat(currentPokemon.length);
      console.log(blankName);
      globalMessage.delete().catch(O_o=>{});
      let msg;
      let guessMap = null;
      guessMap = new Object();
      let revealed = 0;
      revealInterval = setInterval(async function(){
        let randomReveal;
        while(true){
          randomReveal = Math.floor(Math.random() * currentPokemon.length);
          if (guessMap[randomReveal] !== true) {
            revealed++;
            break;
          }
        }
        blankName = setCharAt(blankName, randomReveal, currentPokemon[randomReveal]);
        if (interval === 0){
          msg = await globalMessage.channel.send("**HINT: **" + blankName + "!");
          guessMap[randomReveal] = true;
        } else {
          msg.edit("**HINT: **" + blankName + "!")
        }
        interval++;
        if (interval === 10) {
          console.log(interval + " Derp")
          globalMessage.channel.send("**IT'S " + currentPokemon.toUpperCase() + ", ya dumb bitch!**");
          currentPokemon = "";
          onGoing = false;
          globalMessage = null;
          wtp.resetState();
          startQuiz();
          clearInterval(revealInterval);
        }
      }, 3000);
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
    case 'catch': {
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
        message.reply("**YOU WON!** It was " + currentPokemon + "!");
        message.channel.send("Type !wtp to start a new quiz!");
        startQuiz();
      } else {
        message.reply("Wrong Pokémon!");
      }
    }
    break;
    case 'stop': {
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
bot.login(config.token);
