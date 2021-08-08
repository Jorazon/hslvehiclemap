//get needed elements
const pullbutton = document.getElementById('pullDrawer');
const options = document.getElementById('optionsDrawer');
const info = document.getElementById('vehicleinfo');
const mapoptions = document.getElementById('mapoptions');

let isOut = false;//init drawer as closed
function toggleDrawer(){//toggle drawer open/closed
	if(isOut){options.classList.remove('out')}//if drawer is open close it
	else{options.classList.add('out');}//if drawer is closed open it
	isOut = !isOut;//toggle isOut
}

function addInfo(string, html = false){//add entry to 
	if (html){info.appendChild(document.createElement('p')).innerHTML = string}//using innerHTML to use tags
	else{info.appendChild(document.createElement('p')).innerText = string}//using innerText
}

function newKey(evt){
	//console.log(evt);
	infokey = evt.target.parentElement.parentElement.id;//set key from id
	if(evt.target.classList[0] == 'dot'){//if click event happened on a vehicle dot
		getPath(markers[infokey].data.route,markers[infokey].data.dir);//get vehicle path
		if(!isOut){toggleDrawer()}//open drawer if it is closed
	}
}

function updateInfo(){//vehicele info updater
	if (infokey in markers){//if the clicked element was a vehicle dot
		while(info.firstChild){info.removeChild(info.firstChild);}//remove old info
		data = markers[infokey].data;//get marker data with key
		
		if(data.label){//if ferry then label
			splitted = data.label.split(' ');//split label on spaces
			if(splitted[1]){addInfo(`${cap(markers[infokey].type)} ${cap(splitted[0].toLowerCase())} ${splitted[1]}`)}//if contains multiple parts capitalize only first (only used for Suomenlinna II)
			else {addInfo(`${cap(markers[infokey].type)} ${cap(data.label.split(' ')[0].toLowerCase())}`)}//else capitalize whole thing
		}
		else{addInfo(`${cap(markers[infokey].type)} ${data.desi}`)}//else line designation
		
		addInfo(`Operator: ${transithelper.operators[data.oper.toString()].name}`);//operator name
		
		addInfo(`Speed: ${(data.spd * 3.6).toFixed()} km/h`);//speed
		if (data.acc !== null){addInfo(`Acceleration: ${data.acc} m/s<sup>2</sup>`,true)}//acceleration
		
		if (data.drst == 1){addInfo('Doors open')}//if door status is 1(open) add doors open
		
		delays = Math.abs(data.dl);//get delay in seconds
		delaym = (delays/60).toFixed();//convert to minutes
		if(delaym >= 1){//if delay is a minute or above
			addInfo(`${delaym} minute${(delaym == 1)?'':'s'} ${(data.dl>0)?'ahead of':'behind'} schedule`);//add delay from schedule
		}
	}
	document.title = origTitle + ` | ${Object.keys(markers).length} vehicles running`;
}
//add event listeners
document.addEventListener('click', newKey);//all click events
pullbutton.addEventListener('click', toggleDrawer);//drawer button clic event