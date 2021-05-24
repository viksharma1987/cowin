

var min_age=18;
var min_slots=10;
var id="502";
var refresh_rate=15000


var bot_token="1881620453:AAHohggV5AoCfM9PhSEwqOoHV0QPSMRu4Q4"
var channel="JODVaccineQuickAlert"



var slotData = '';

function getVaccineSlots (id) {
  console.log("Preparing to call get vaccine slots");
    
    var now = new Date();

    if (now.getHours() <= 18) {
      var startDate = now.toLocaleDateString('en-GB').replaceAll("/","-");
      console.log('Searching for today - ' + startDate)
    } else {
      var tomorrow = new Date()
      tomorrow.setDate(now.getDate() + 1)
      var startDate = tomorrow.toLocaleDateString('en-GB').replaceAll("/","-");
      console.log('Searching for tomorrow - ' + startDate)
    }

    
    var api = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=${id}&date=${startDate}`;  
    var requestOptions = {
        method: 'GET',
        redirect: 'follow'
    };

    fetch(api, requestOptions)
    .then(response => response.text())
    .then(result => processVaccineData(result))
    .catch(error => console.log('Error getting response from api', error));
}

function processVaccineData(vaccineSlotData) {
    let availableSlots=[];
    let centersMap = new Map();
    data = JSON.parse(vaccineSlotData);
    if(data && data.centers) {
    for(let center of data.centers) {
        if(center && center.sessions) {
            for(let session of center.sessions) {
                if(session!=null && session['min_age_limit']==min_age && session['available_capacity'] > min_slots) {
                    availableSlots.push({
                                          pincode:center.pincode,
                                          name:center.name,
                                          block_name:center.block_name,
                                          district_name:center.district_name,
                                          address:center.address,
                                          fee_type:center.fee_type,
                                          slots:session.available_capacity,
                                          dose1:session.available_capacity_dose1,
                                          dose2:session.available_capacity_dose2,
                                          vaccine:session.vaccine,
                                          age:session.min_age_limit,
                                          date:session.date
                                          });
                }
            }
            if(availableSlots.length!=0) {
                totalSlots = availableSlots.reduce(getSum,0);
                centersMap.set(center.center_id,{slots:parseInt(totalSlots),value:availableSlots});
//                 centersMap.set(center.center_id,availableSlots);
                availableSlots=[];
            }
        }
    }
    notifyUser(centersMap);
    }
}

function notifyUser(centersMap) {
    console.log(centersMap);
    //send notifications only if data available or if data has changed since previous notification
    if(centersMap.size>0 && compareIfSlotDataHasChanged(centersMap)) {
        var message = "\n";
        centersMap.forEach((value,key)=> {
            console.log(value.slots)
            value.value.forEach(item=>{
                 message += `*[${item.pincode}]*`
                 message += "%0D%0A%0D%0A"
                 message += `_${item.block_name}_, _${item.district_name}_`
                 message += "%0D%0A%0D%0A"
                 message += `*[${item.vaccine} - ${item.fee_type}] ${item.date}: ${item.dose1} slots*`
                 message += "%0D%0A"
                 message += `*[${item.vaccine} - ${item.fee_type}] ${item.date}: ${item.dose2} slots*`
                 message += "%0D%0A%0D%0A"
                 message += `Name: ${item.name}`
                 message += "%0D%0A"
                 message += `Min Age:: ${item.age}`
                 message += "%0D%0A"
                 message += `Address: ${item.address}`
                 message += "%0D%0A%0D%0A"
                 message += "================================="
                 message += "%0D%0A%0D%0A"
                 message += "https://selfregistration.cowin.gov.in/appointment"
                 message += "%0D%0A%0D%0A"
            });
        }
    );
        postTelegram (message);
        message = "";
    }

}

function postTelegram (msg) {

  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  fetch(`https://api.telegram.org/bot${bot_token}/sendMessage?parse_mode=markdown&chat_id=@${channel}&text=${msg}`, requestOptions)
    .then(response => response.text())
    .then(result => console.log(result))
    .catch(error => console.log('error', error));
}

function compareIfSlotDataHasChanged(data) {
    var isChange = true;
    if(slotData && slotData.size==data.size) {
        isChange = !isDataOfAllKeysSame(slotData,data);
    }
    slotData = data;
    return isChange;
}

function isDataOfAllKeysSame(oldMap,newMap) {
    for(var[key,val] of newMap) {
        if(!oldMap.has(key) || !isCentresDataSame(oldMap.get(key),val))
            return false;
    }
    return true;
}

function isCentresDataSame(oldObj,newObj) {
    if(oldObj.value.length != newObj.value.length)
    return true;
    for(let i=0;i<newObj.length;i++) {
        if(oldObj.value[i].date!=newObj.value[i].date || oldObj.value[i].slots!==newObj.value[i].slots )
          return false;
    }
    return true;
}

function getSum(total, num) {
    return total + num.slots;
}

// Simpler, does exactly the same thing:
var i = 0;
function go () {
    console.log(i);
    getVaccineSlots(id);
    i++;

    setTimeout(go, refresh_rate); // callback
}
go();

// getVaccineSlots("294");
