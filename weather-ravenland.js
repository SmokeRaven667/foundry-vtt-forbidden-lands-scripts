let html = '';
let htmlStorage = ''; // place to store previous html so we can display without generating new
const campaigns = ['Bitter Reach', 'Forbidden Lands'];
const biomes = ['Tundra', 'Ice Cap', 'Mountains', 'Ice Forest', 'Ocean', 'Sea Ice'];
const seasons = ['Breakup', 'Bright Winter', 'Dark Winter', 'True Winter'];
let data = {campaigns: campaigns, biomes: biomes, seasons: seasons};
biomes.sort();
seasons.sort();

let selectedCampaign = 'Bitter Reach';
let selectedBiome = 'Ice Cap';
let selectedSeason = 'Breakup';
const cold_bitter_reach = [`FREEZING`, `FREEZING`, `FREEZING`, `BITING`, `BITING`, `TO THE BONE`]
const cold_forbidden_lands = [`CHILLY`, `CHILLY`, `CHILLY`, `FREEZING`, `FREEZING`, `BITING`]
const heat_forbidden_lands = [`WARM`, `WARM`, `WARM`, `HOT`, `HOT`, `SWELTERING`]
const heat_aslene = [`HOT`, `HOT`, `HOT`, `SWELTERING`, `SWELTERING`, `SCORCHING`]
const snow = [`NO SNOW`, `NO SNOW`, `NO SNOW`, `LIGHT SNOWFALL`, `LIGHT SNOWFALL`, `HEAVY SNOWFALL`]
const wind = [`NO`, `LIGHT`, `LIGHT`, `STRONG`, `STRONG`, `STORMY`]
const clouds = ['CLEAR', 'SCATTERED CLOUDY', 'CLOUDY', 'OVERCAST', 'RAIN CLOUDS in the', 'DARK CLOUDS in the']
let cold = cold_forbidden_lands; // changes based on selected campaign
let heat = heat_forbidden_lands;
let templateFile = "modules/smoke-raven-foundry-vtt-forbidden-lands-scripts/templates/WeatherTemplate.html";
delete _templateCache[templateFile];
const getTemplate = renderTemplate(templateFile, data);
let myContent;
/*
 * Create a custom config setting for tracking defaults for weather dialog
 */
let weatherChoices = game.settings.register('smoke-raven', 'weather-choices', {
  name: 'weather-choices',
  hint: 'A description of the registered setting and its behavior.',
  scope: 'world',     // "world" = sync to db, "client" = local storage
  config: true,       // false if you dont want it to show in module config
  type: String,       // Number, Boolean, String,
  default: 0,
  range: {           // range turns the UI input into a slider input
    min: 0,           // but does not validate the value
    max: 100,
    step: 10
  },
  onChange: value => { // value is the new value of the setting
    console.log(value)
  },
  filePicker: false,  // set true with a String `type` to use a file picker input
});
let weatherPrevious = game.settings.register('smoke-raven', 'previous-weather', {
  name: 'previous-weather',
  hint: 'A description of the registered setting and its behavior.',
  scope: 'world',     // "world" = sync to db, "client" = local storage
  config: true,       // false if you dont want it to show in module config
  type: String,       // Number, Boolean, String,
  default: 0,
  range: {           // range turns the UI input into a slider input
    min: 0,           // but does not validate the value
    max: 100,
    step: 10
  },
  onChange: value => { // value is the new value of the setting
    console.log(value)
  },
  filePicker: false,  // set true with a String `type` to use a file picker input
});
/*
SOME WEIRD WEATHER TO WORK INTO THE MIX
acid rain
blizzard (see BR handout)
lightning storm (colored)
holy rain
northern lights
avalanche (see BR handout)
cold snap (see BR condition for cold rolled 6)
geyser (see BR handout)
bloodmist (see handout)
raining frogs (doubt damage)
* */

const getAssets = $.getScript("modules/smoke-raven-foundry-vtt-forbidden-lands-scripts/templates/constants.js");

Promise.all([getAssets]).then((values) => {
    Promise.all([getTemplate]).then((template) => {
        myContent = template;
        main();
    });
});

function main() {
    console.log('myContent resolved, now running main()')
    setPageVars();
    showDialog();
}

function createHTML() {
    console.log('createHTML')
    let coldConsequence1 = `ENDURANCE each Quarter Day or ${COLD} (if inadequate protection).`;
    let coldConsequence2 = `ENDURANCE each Quarter Hour or ${COLD} (if inadequate protection).`;
    let coldConsequence3 = `ENDURANCE each Quarter Day or ${COLD}. Every Quarter Hour at -2 modifier if not adequate protection.`;
    let heatConsequence1 = `ENDURANCE each Quarter Day or ${OVERHEATED} (if inadequate protection).`;
    let heatConsequence2 = `ENDURANCE each Quarter Hour or ${OVERHEATED} (if inadequate protection).`;
    let heatConsequence3 = `ENDURANCE each Quarter Day or ${OVERHEATED}. Every Quarter Hour at -2 modifier if not adequate protection.`;
    let enduranceToHikeDesc = `ENDURANCE to ${HIKE} for Quarter Day.`;
    const temperature = [`COLD`, `NORMAL`, `NORMAL`, `NORMAL`, `NORMAL`, `HOT`]
    let rain = [] // rain is conditionally build based on clouds roll
    let fishMod = 0;
    let keepWatchMod = 0;
    let huntMod = 0;
    let makeCampMod = 0;
    let forageMod = 0;
    let leadTheWayMod = 0;
    let enduranceToHike = 0;

    let snowStormConditional = `${escapedBreak}ENDURANCE roll made with a –2 due to STORM.`

    let wr = getWeatherRolls();
    let rolls = wr[0];
    rain = wr[1];

    let coldDescription = cold[rolls.cold-1]
    let heatDescription = heat[rolls.heat-1]
    let snowDescription = snow[rolls.snow-1]
    let rainDescription = rain[rolls.rain-1];
    let cloudDescription = clouds[rolls.cloud -1]
    let temperatureDescription = temperature[rolls.temperature-1]
    let coldConsequence = null;
    let heatConsequence = null;
    if (rolls.snow > 0) {
        switch (snowDescription) {
            case('NO SNOW'):
                break;
            case('LIGHT SNOWFALL'):
                leadTheWayMod += -1
                break;
            case('HEAVY SNOWFALL'):
                leadTheWayMod += -2
                enduranceToHike += 1;
                break;
        }
    }
    if (rolls.cloud == 1) {
        forageMod += 1
        huntMod += 1

    }
    if (rolls.cold > 0) {
        switch(coldDescription) {
            case('CHILLY'):
                coldConsequence = '';
            case('FREEZING'):
                coldConsequence = coldConsequence1;
                break;
            case('BITING'):
                coldConsequence = coldConsequence2;
                break;
            case('TO THE BONE'):
                coldConsequence = coldConsequence3;
                break;
        }
    }
    if (rolls.heat > 0) {
        switch(heatDescription) {
            case('WARM'):
                heatConsequence = '';
            case('HOT'):
                heatConsequence = heatConsequence1;
                break;
            case('SWELTERING'):
                heatConsequence = heatConsequence2;
                break;
            case('SCORCHING'):
                heatConsequence = heatConsequence3;
                break;
        }
    }
    switch(rainDescription) {
        case('NO RAIN'):
            break;
        case('SHOWERING RAIN'):
            huntMod += -1
            fishMod += 1
            break;
        case('STEADY RAIN'):
            keepWatchMod += -1
            huntMod += -1
            makeCampMod += -1
            fishMod += 2
            break;
        case('HEAVY RAIN'):
            keepWatchMod += -1
            huntMod += -1
            makeCampMod += -1
            fishMod += 1
            break;
    }
    let windDescription = wind[rolls.wind-1]
    switch(windDescription) {
        case('NO'):
            fishMod = 1;
            break;
        case('LIGHT'):
            break;
        case('STRONG'):
            makeCampMod += -1;
            break;
        case('STORMY'):
            makeCampMod += -2;
            enduranceToHike += 1;
            break;
    }
    if (windDescription === 'STRONG' && rainDescription==='HEAVY RAIN') {
        keepWatchMod += -1
        huntMod += -1
        makeCampMod += -1
        forageMod += -1
        fishMod += -1
    }
    if (windDescription === 'STORMY' && rainDescription==='HEAVY RAIN') {
        keepWatchMod += -2
        huntMod += -2
        makeCampMod += -2
        forageMod += -2
        fishMod += -2
        leadTheWayMod += -1
    }
    switch(selectedSeason) {
        case('Breakup'):
            forageMod += 0;
            break;
        case ('Bright Winter'):
            forageMod += 1;
            break;
        case('Dark Winter'):
            forageMod += -1;
            break;
        case('True Winter'):
            forageMod += -2;
            break;
    }
    switch(selectedBiome) {
        case('Plains'):
            forageMod += -1;
            huntMod += 1;
            break;
        case ('Forest'):
            forageMod += 1;
            huntMod += 1;
            break;
        case('Dark Forest'):
            forageMod += -1;
            break;
        case('Hills'):
            break;
        case('Mountains'):
            forageMod += -2;
            huntMod += -1;
            break;
        case('Lake'):
            break;
        case('Marshland'):
            forageMod += 1;
            huntMod += -1;
            break;
        case('Quagmire'):
            forageMod += -1;
            break;
        case('Ruins'):
            forageMod += -2;
            huntMod += -1;
            break;
        case('Tundra'):
            forageMod += -1;
            huntMod += 1;
            break;
        case('Ice Cap'):
            huntMod += -1;
            break;
        case('Ice Forest'):
            forageMod += -1;
            break;
        case('Ocean'):
            break;
        case('Sea Ice'):
            break;
    }

    // weather settingts were here

    html = `<div>
        <img style="max-height: 250px, max-width: 250px" src="https://bit.ly/3tSrtai"/>
        <br/>
        <b>Season: </b>${selectedSeason} -- <b>Biome: </b>${selectedBiome}<br/>
        ${temperatureDescription} temperature with ${windDescription} winds and 
${cloudDescription} sky.`

    if (rolls.rain > 0 && rainDescription !== 'NO RAIN') {
        html += ` There is a ${rainDescription}.<br/>`
    }

    if (rolls.cold > 0){html += ` The cold is ${coldDescription}`;}
    if (rolls.snow > 0 && snowDescription !== 'NO SNOW'){html += ` with ${snowDescription}.`;}
    else if (rolls.cold > 0 && snowDescription == 'NO SNOW') {html += `.`;}
    if (rolls.heat > 0){ html += ` The heat is ${heatDescription}.<br/>`;}
    html.replace(/(<br\/>$)/, '');
    html += `<hr/>`;
    html.replace(/(<br\/>$)/, '');
    if (fishMod != 0) { let plus = (fishMod<0)?'':'+'; html += `<b>${plus}${fishMod}</b> to ${FISH}<br/>`;}
    if (keepWatchMod != 0) {
        let plus = (keepWatchMod<0)?'':'+';
        html += `<b>${plus}${keepWatchMod}</b> to ${KEEPWATCH}<br/>`;
    }
    if (huntMod != 0) { let plus = (huntMod<0)?'':'+'; html += `<b>${plus}${huntMod}</b> to ${HUNT}<br/>`;}
    if (makeCampMod != 0) { let plus = (makeCampMod<0)?'':'+'; html += `<b>${plus}${makeCampMod}</b> to ${MAKECAMP}<br/>`;}
    if (forageMod != 0) {
        let canForage = true;
        let forageDesc = FORAGE;
        if(selectedCampaign == 'Bitter Reach') {
            canForage = ['Ice Forest', 'Mountains', 'Tundra'].includes(selectedBiome);
            if (!canForage) {
                forageDesc = "Forage only in Tundra, Ice Forest, and Mountain.";
            }
        };
        let plus = (forageMod<0)?'':'+';
        if (canForage) {
            html += `<b>${plus}${forageMod}</b> to `;
        }
        html += ` ${forageDesc}<br/>`;
    }
    if (leadTheWayMod != 0) { let plus = (leadTheWayMod<0)?'':'+'; html += `<b>${plus}${leadTheWayMod}</b> to ${LEADTHEWAY}<br/>`;}
    // remove last line break for tighter output
    html.replace(/(<br\/>$)/, '');
    html += `<hr/>`;
    html.replace(/(<br\/>$)/, '');
    if (enduranceToHike != 0) { html += `<b>&#8226;</b> ${enduranceToHikeDesc}<br/>`;}

    if (rolls.wind == 6 && rolls.snow == 6) { html += `<b>&#8226;</b> ${snowStormConditional}<br/>`; }
    if (rolls.cold > 0) { html += `<b>&#8226;</b> ${coldConsequence}<br/>`; }
    if (rolls.heat > 0) { html += `<b>&#8226;</b> ${heatConsequence}<br/>`; }
    html += `</div>`;

}

function getDisplayWeatherClick() {
    let previousWeather = game.settings.get('smoke-raven','previous-weather');
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: previousWeather
    });
}
function getWeatherClick() {
    console.log('getWeatherClick');
    createHTML();
    weatherSettings = game.settings.set('smoke-raven','previous-weather', html);
    ChatMessage.create({
        user: game.user._id,
        speaker: ChatMessage.getSpeaker({token: actor}),
        content: html
    });
}
function getWeatherRolls() {
    console.log('getWeatherRolls')
    let windRoll = new Roll(`1d6`).evaluate({async: false}).total;
    let temperatureRoll = new Roll("1d6").evaluate({async: false}).total ;
    if (selectedCampaign === 'Bitter Reach'){
        temperatureRoll = 1;
    }
    let cloudRoll = new Roll("1d6").evaluate({async: false}).total;
    let snowRoll = 0;
    let coldRoll = 0;
    let heatRoll = 0;
    let rainRoll = 0;

    // rain array is different based on kind of clouds we have
    rain = getRain(cloudRoll);
    if (cloudRoll >= 3) {
        rainRoll = new Roll(`1d6`).evaluate({async: false}).total;
    }
    if (temperatureRoll == 1) {
        // TODO: modify for biome

        coldRoll = new Roll("1d6").evaluate({async: false}).total;
        if (selectedCampaign === 'Bitter Reach') {
            if (windRoll == 5) { coldRoll = coldRoll + 1;}
            if (windRoll == 6) { coldRoll = coldRoll + 2;}
        }

        snowRoll = new Roll("1d6").evaluate({async: false}).total;
    }
    if (temperatureRoll == 6) {
        // TODO: modify for biome
        heatRoll = new Roll("1d6").evaluate({async: false}).total;
    }
    if (snowRoll > 3) {
        rainRoll = 0;
    }
    return [{
        'snow': rollCapper(snowRoll),
        'wind': rollCapper(windRoll),
        'temperature': rollCapper(temperatureRoll),
        'cloud': rollCapper(cloudRoll),
        'rain': rollCapper(rainRoll),
        'cold': rollCapper(coldRoll),
        'heat': rollCapper(heatRoll)
    }, rain];
}
function rollCapper(roll) {
    return (roll <=6)?roll:6;
}
function getRain(cloudRoll) {
    console.log('getRain')
    let noRain = 0;
    let showers = 0;
    let steady = 0;
    let heavy = 0;
    switch (cloudRoll) {
        case 1:
            noRain = 6;
            break;
        case 2:
            noRain = 6;
            break;
        case 3:
            showers = 1;
            noRain = 5;
            break;
        case 4:
            showers = 2;
            noRain = 4;
            break;
        case 5:
            showers = 2;
            steady = 2;
            noRain = 2;
            break;
        case 6:
            showers = 2;
            steady = 2;
            heavy = 1;
            noRain=1;
            break;
    }
    let rain = [];
    pushToArray(noRain, rain, 'NO RAIN');
    pushToArray(showers, rain, 'SHOWERING RAIN');
    pushToArray(steady, rain, 'STEADY RAIN');
    pushToArray(heavy, rain, 'HEAVY RAIN');
    function pushToArray(num, arr, term){
      for (var i = 0; i < num; i++) arr.push(term);
    }
    return rain;
}

function setPageVars() {
    weatherSettings = game.settings.get('smoke-raven','weather-choices');

    if (!weatherSettings) {
        selectedCampaign = 'Bitter Reach';
        selectedSeason = 'Breakup';
        selectedBiome = 'Ice Cap';

        // weatherMain();
    }
    else {
        let ws = weatherSettings.split(',');
        selectedCampaign = ws[0];
        selectedSeason = ws [1];
        selectedBiome = ws[2];
    }
}

function showDialog() {
    new Dialog({
        title: 'Generate Weather',
        content: myContent,
        buttons: {
            yes: {
                icon: "",
                label: `Get Weather`,
                callback: () => getWeatherClick()
            },
            no: {
                icon: "",
                label: `Display Weather`,
                callback: () => getDisplayWeatherClick()
            },
            clear: {
                icon: "",
                label: `Clear Data`,
                callback: () => clearWeatherSelections()
            }
        },
        render: () => setChoices(),
        default: 'yes'
    }).render(true);
}

clearWeatherSelections = () => {

    /* script to reset settings value that track used merchant images */
    game.settings.set('smoke-raven','weather-choices', '');
};
setChoices = () => {
    console.log('setChoices')
    $('#campaign').val(selectedCampaign);
    $('#season').val(selectedSeason);
    $('#biomes').val(selectedBiome);
    //$('form select[name="biomes"] option[value="' + selectedBiome+ '"]').prop('selected','selected');
};
// get newly selected biome and set global value as well as store in settings
handleBiomeChange = (e) => {
    console.log('handleBiomeChange')
    let getvalue = e.value;
    selectedBiome = getvalue;
    let weatherSettings = `${selectedCampaign},${selectedSeason},${selectedBiome}`;
    game.settings.set('smoke-raven','weather-choices', weatherSettings);
    createHTML();
};
// get newly selected season and set global value as well as store in settings
handleSeasonChange = (e) => {
    console.log('handleSeasonChange')
    let getvalue = e.value;
    selectedSeason = getvalue;
    let weatherSettings = `${selectedCampaign},${selectedSeason},${selectedBiome}`;
    game.settings.set('smoke-raven','weather-choices', weatherSettings);
    createHTML();
};

// NOTE: not wired in and working at this time
handleCampaignChange = (e) => {
  console.log('handleCampaignChange')

  let getvalue = e.value;
  console.log(getvalue)

    selectedCampaign = getvalue;
  if (selectedCampaign ==='Bitter Reach') {
      cold = cold_bitter_reach;
      heat = heat_forbidden_lands;
  }
  else
  { 
    cold = cold_forbidden_lands;
    heat = heat_forbidden_lands;
}
if (selectedCampaign ==='Aslene') {
    cold = cold_forbidden_lands
    heat = heat_aslene;
}
    createHTML()
}

