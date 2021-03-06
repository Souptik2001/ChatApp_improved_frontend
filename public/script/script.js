    var messaging_type = 'direct';
    var f_i_type1;
    var f_i_type2;
    var f_i_type3;
    var f_i_type4;
    var contacts_l = {};
    var changingUser = 0;
    var unread = [];
    var receiver;
    var extra_contact = '';
    var endpoint = 'https://api-chatappi.herokuapp.com'; // This will be changed to the api in which we host the app-backend
    const socket = io('https://api-chatappi.herokuapp.com'); // This will be changed to the api in which we host the app-backend
    // var endpoint = 'http://localhost:3000'; // This will be changed to the api in which we host the app-backend
    // const socket = io('http://localhost:3000'); // This will be changed to the api in which we host the app-backend
    document.getElementById('direct').remove();

    // Collecting the username from cookie
    var username;
    var cookies_s = decodeURIComponent(document.cookie);
    if (cookies_s != undefined) {
        var cookies = cookies_s.split("; ");
        for (var i = 0; i < cookies.length; i++) {
            if(cookies[i].indexOf("name=") == 0){
                username = cookies[i].substring("name=".length, cookies[i].length);
            }
        }
    }
    document.getElementById('logout_i').innerText = `Logout ${username}`;
    if(username == undefined || username == ''){
        location.reload();
    }else{
        socket.emit('noteUserid', username);
    }
    socket.on('showOnline', (data)=>{
        console.log(data);
    });


    // Deciding messaging type
    function changeMsgType(messagingType){
        for(var i=1; i<5; i++){
            document.getElementById(`chats_i_type${i}`).innerHTML = '';
        }
        var cap = messaging_type[0].toUpperCase() +  messaging_type.slice(1); 
        document.getElementById('sub-menu_i').innerHTML += `<li id="${cap}" onclick="changeMsgType('${cap}')">${cap}</li>`;
        messaging_type = messagingType;
        cap = messaging_type[0].toUpperCase() +  messaging_type.slice(1); 
        document.getElementById(messaging_type).remove();
        document.getElementById('type_heading').innerText = cap;
        if(messagingType=='direct'){
            receiver=undefined;
            document.getElementById('contacts_i').innerHTML = '';
            document.getElementById('contacts_i').innerHTML += `<div class="userSearch">
                <input type="text" name="user_s" id="user_s_i" style="background-color: rgb(226, 226, 226); color: rgb(0, 0, 0); width: 80%; border-radius: 8px;" onkeyup="searchUser(event)" placeholder="Seach by username or email...">
                <div class="options" id="options_i">

                </div>
            </div>`;
            document.getElementById('contacts_i').innerHTML += `<div class="typeSelection">
                <ul class="menu">
                    <li><div id="type_heading">Direct</div>
                        <ul class="sub-menu" id="sub-menu_i">
                            <li id="broadcast" onclick="changeMsgType('broadcast')">BroadCast</li>
                        <li id="multiple" onclick="changeMsgType('multiple')">Mutiple</li>
                        </ul>
                    </li>
                </ul>
            </div>`;
            populateContacts();

        }else if (messagingType=='broadcast') {
            document.getElementById('intro_i').style.display = 'none';
            document.getElementById('chating_i').style.display = 'flex';
            extra_contact='';
            receiver = -1;
            document.getElementById('contacts_i').innerHTML = '';
            document.getElementById('contacts_i').innerHTML = `<div class="typeSelection">
                <ul class="menu">
                    <li><div id="type_heading">BroadCast</div>
                        <ul class="sub-menu" id="sub-menu_i">
                        <li id="direct" onclick="changeMsgType('direct')">Direct</li>
                        <li id="multiple" onclick="changeMsgType('multiple')">Mutiple</li>
                        </ul>
                    </li>
                </ul>
            </div>`;
            socket.emit('getBroadcastMessages', username);
        } else {
            
        }
    }
    // When the server sends the broadcast messages send by a user it is used to populate them in the chat box
    socket.on('sendingBroadcastMessages', (data)=>{
        console.log(data);
        if(receiver==-1){
            for(var i=0; i<data.length; i++){
                document.getElementById(`chats_i_${data[i].message_type}`).innerHTML += `<div class="you chat">${data[i].txt}<div>`;
            }
        }
    });
    // Searching for user
    socket.on('searchedUsers', (data)=>{
        document.getElementById('options_i').innerHTML = '';
        for(var i=0; i<data.length; i++){
            if(contacts_l[data[i].username]==undefined && data[i].username!=username && extra_contact!=data[i].username){
                document.getElementById('options_i').innerHTML += `<p style="color: black; padding-top: 5px;padding-bottom: 5px; width:80%; border-radius: 8px;margin: 0; border-bottom: solid 1px rgb(0, 0, 0);" onClick="setUser('${data[i].username}')" class="eachSearchUser"><strong>${data[i].username}</strong></p>`;
            }
        }
    });
    // When a new user is selected from the chatbo
    function setUser(user){
        document.getElementById('user_s_i').value= '';
        document.getElementById('options_i').innerHTML='';
        document.getElementById('contacts_i').innerHTML += `<div class="contact" id=${user} onclick="changeReceiver('${user}')"><div id="uname_${user}">${user}</div><div class="unread_num" id="unread_count_${user}"></div></div><div id="seperator_${user}" style="height: 1px; background-color: #EAEFF5"></div>`;
        document.getElementById(`unread_count_${user}`).style.display = 'none';
        changeReceiver(user);
        extra_contact = user;
    }
    function searchUser(event){
        if(event.keyCode!=13){
            if(document.getElementById('user_s_i').value==''){
                document.getElementById('options_i').innerHTML='';
            }else{
                socket.emit('searchForUser', document.getElementById('user_s_i').value);
            }
        }
    }
    // For populating the message in the client(subscriber side) side
    function populateMsg(data){
        // If the user is currently not in the sender's tab
            if(data.sender!=receiver){
                // If the sender is not in contact of the receiver then -
                if(contacts_l[data.sender]==undefined){
                    // Update the local contacts list
                    contacts_l[data.sender] = true;
                    // Update the database contact table of relation "subscriber"->"publisher"
                    socket.emit('addNewContact', {
                        user: username,
                        subs: contacts_l
                    });
                    // If we are not in broadcast tab then create a new tab for the new publisher
                    if(receiver!=-1){
                        document.getElementById('contacts_i').innerHTML += `<div class="contact" id=${data.sender} onclick="changeReceiver('${data.sender}')"><div id="uname_${data.sender}">${data.sender}</div><div class="unread_num" id="unread_count_${data.sender}"></div></div><div style="height: 1px; background-color: #EAEFF5"></div>`;
                        document.getElementById(`unread_count_${data.sender}`).style.display = 'none';
                    }
                }
                // If we are not in broadcast tab then change the unread number
                if(receiver!=-1){
                    document.getElementById(`unread_count_${data.sender}`).style.display = '';
                    document.getElementById(`unread_count_${data.sender}`).innerText = 1 + Number(document.getElementById(`unread_count_${data.sender}`).innerText);
                }
                // Adding to the unread table
                if(data.receiver==-1){
                    socket.emit('addToUnread', {
                        user: data.sender,
                        receiver: username
                    });
                }else{
                    socket.emit('addToUnread', {
                        user: data.sender,
                        receiver: data.receiver
                    });
                }
            }else{
                // To handle the case if the receiver is in a new contacts tab and that new contacts suddenly messages
                if(contacts_l[data.sender]==undefined && extra_contact!=''){
                    contacts_l[data.sender]=true;
                    socket.emit('addNewContact', {
                        user: username,
                        subs: contacts_l
                    });
                    extra_contact='';
                    console.log(`extra_contact - ${extra_contact}`);
                }
                console.log(data);
                document.getElementById(`chats_i_${data.msg_type}`).innerHTML += `<div class="other chat">${data.txt}<div>`;
                document.getElementById(`chats_i_${data.msg_type}`).scrollTo(0, document.getElementById(`chats_i_${data.msg_type}`).scrollHeight);
            }
        }
    
    socket.on('populateMsg', (message)=>{
        var data = JSON.parse(message);
        populateMsg(data);
    })
    // For initial loading of messages
    function getData() {
        socket.emit('initialChats', {
            sender:username,
            receiver:receiver,
            items:1000
        });
    }
    // API call to get the contacts of an user
    function getContacts() {
        return new Promise(async(resolve, reject) => {
            var HTTP = new XMLHttpRequest();
            HTTP.onreadystatechange = function() {
                if (HTTP.readyState == XMLHttpRequest.DONE) {
                    console.log(HTTP.responseText);
                    resolve((JSON.parse(HTTP.responseText)));
                }
            }            
            await HTTP.open("GET", endpoint + `/getContacts?user=${username}`, true);
            await HTTP.send();
        });
    }
    // Send by server sending the unread messages for the user
    socket.on('checked-unread-cache', (data)=>{
        console.log(data);
        for (const [key, value] of Object.entries(data)) {
            // Update local and database contact
            if(contacts_l[key]==undefined){
                contacts_l[key] = true;
                socket.emit('addNewContact', {
                    user: username,
                    subs: contacts_l
                });
                // Add tab of the new contact
                document.getElementById('contacts_i').innerHTML += `<div class="contact" id=${key} onclick="changeReceiver('${key}')"><div id="uname_${key}">${key}</div><div class="unread_num" id="unread_count_${key}"></div></div><div id="seperator_${key}" style="height: 1px; background-color: #EAEFF5"></div>`;
                document.getElementById(`unread_count_${key}`).style.display = 'none';
            }
            // Adding the unread count
            if(document.getElementById(`unread_count_${key}`).innerText==''){
                document.getElementById(`unread_count_${key}`).innerText = value;
            }else{
                document.getElementById(`unread_count_${key}`).innerText = Number(document.getElementById(`unread_count_${key}`).innerText) + Number(value);
            }
            document.getElementById(`unread_count_${key}`).style.display = '';
        }
    });
    // Send by server sending the unread messages for the user
    socket.on('checked-unread', (data)=>{
        console.log(data);
        // If unread found
        for(var i = 0; i< data.length; i++){
            // Update local and database contact
            if(contacts_l[data[i].username]==undefined){
                console.log(data);
                contacts_l[data[i].username] = true;
                socket.emit('addNewContact', {
                    user: username,
                    subs: contacts_l
                });
                // Add tab of the new contact
                document.getElementById('contacts_i').innerHTML += `<div class="contact" id=${data[i].username} onclick="changeReceiver('${data[i].username}')"><div id="uname_${data[i].username}">${data[i].username}</div><div class="unread_num" id="unread_count_${data[i].username}"></div></div><div id="seperator_${data[i].username}" style="height: 1px; background-color: #EAEFF5"></div>`;
                document.getElementById(`unread_count_${data[i].username}`).style.display = 'none';
            }
            // Adding the unread count
            if(document.getElementById(`unread_count_${data[i].username}`).innerText==''){
                document.getElementById(`unread_count_${data[i].username}`).innerText = data[i].number;
            }else{
                document.getElementById(`unread_count_${data[i].username}`).innerText = Number(document.getElementById(`unread_count_${data[i].username}`).innerText) + Number(data[i].number);
            }
            document.getElementById(`unread_count_${data[i].username}`).style.display = '';
        }
    });
    //Starting point of the app here it loads the contacts of the user
    function populateContacts(){
        getContacts().then(async(contacts) => {
            contacts_l = JSON.parse(contacts[0].subs);
            console.log(contacts_l);
            for (const [key, value] of Object.entries(contacts_l)) {
                // Add the tabs
                document.getElementById('contacts_i').innerHTML += `<div class="contact" id=${key} onclick="changeReceiver('${key}')"><div id="uname_${key}">${key}</div><div class="unread_num" id="unread_count_${key}"></div></div><div id="seperator_${key}" style="height: 1px; background-color: #EAEFF5"></div>`;
                document.getElementById(`unread_count_${key}`).style.display = 'none';
            }
            // Check any unread for every contact
            socket.emit('checkUnread', username);
            // Check for any broadcast unread message
            socket.emit('checkUnreadCache', username);
        });
    }
    populateContacts();

    // This function is called when user selects anotther user's(contact's) tab
    function changeReceiver(user) {
        document.getElementById('intro_i').style.display='none';
        document.getElementById('chating_i').style.display = 'flex';
        changingUser = 1;
        if(document.getElementById(`unread_count_${user}`).innerText!=''){
            socket.emit('deleteFromUnread', {
                user: user,
                receiver: username
            });
            socket.emit('deleteFromUnreadCache', {
                user: user,
                receiver: username
            });
            document.getElementById(`unread_count_${user}`).innerText='';
            document.getElementById(`unread_count_${user}`).style.display='none';
        }
        if(extra_contact!=''){
            (document.getElementById(extra_contact)).remove();
            (document.getElementById(`seperator_${extra_contact}`)).remove();
            extra_contact='';
            receiver = user;
        }
        if (receiver != undefined) {
            document.getElementById(`uname_${receiver}`).innerText = document.getElementById(receiver).id;
        }
        receiver = user;
        document.getElementById(`uname_${receiver}`).innerHTML = `<strong>${document.getElementById(receiver).innerText}  >></strong>`
        getData();
    }
    // This event is send by the server in which the server sends the chats of an user
    socket.on('sendingInitialChats', msgs => {
            f_i_type1=0; f_i_type2=0; f_i_type3=0; f_i_type4=0;
            document.getElementById('chats_i_type1').innerHTML='';document.getElementById('chats_i_type2').innerHTML='';document.getElementById('chats_i_type3').innerHTML='';document.getElementById('chats_i_type4').innerHTML='';
            for (var i = 0; i < msgs.length; i++) {
                var msg_type = msgs[i].message_type;
                if(msg_type=='type1'){f_i_type1=msgs[i].id;};if(msg_type=='type2'){f_i_type2=msgs[i].id;};if(msg_type=='type3'){f_i_type3=msgs[i].id;};if(msg_type=='type4'){f_i_type4=msgs[i].id;};
                while(msg_type==msgs[i].message_type){
                    if (msgs[i].sender == username) {
                        if (i == 0) {
                            document.getElementById(`chats_i_${msg_type}`).innerHTML += `<div class="you chat" id="topmost">${msgs[i].txt}</div>`;
                        } else {
                            document.getElementById(`chats_i_${msg_type}`).innerHTML += `<div class="you chat">${msgs[i].txt}</div>`;
                        }
                    } else {
                        if (i == 0) {
                            document.getElementById(`chats_i_${msg_type}`).innerHTML += `<div class="other chat" id="topmost">${msgs[i].txt}</div>`;
                        } else {
                            document.getElementById(`chats_i_${msg_type}`).innerHTML += `<div class="other chat">${msgs[i].txt}</div>`;
                        }
                    }
                    document.getElementById(`chats_i_${msg_type}`).scrollTo(0, document.getElementById(`chats_i_${msg_type}`).scrollHeight);
                    i++;
                    if(i==msgs.length){
                        i++;
                        break;
                    }       
                }
                i--;

            }
            if(document.getElementById('topmost')!=null){
                // observer.observe(document.getElementById('topmost'));
            }
            changingUser = 0;
        });
    // This function is called when the logout button is clicked
    function logout() {
        document.cookie = "authorization=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
        location.reload();
    }
    // This function is called when the send button is pressed
    async function pushData(msg_type) {
        if (receiver != undefined) {
                if (document.getElementById(`msg_${msg_type}`).value != "") {
                    var payload = {
                        txt : document.getElementById(`msg_${msg_type}`).value,
                        msg_type : msg_type,
                        date : "Sometime",
                        sender : username,
                        receiver : receiver
                    };
                    if(contacts_l[receiver]==undefined && receiver!=-1){ // This is to check if the publisher is in contact with the subscriber
                        contacts_l[receiver] = true;
                        extra_contact='';
                        // Ading the new subs object
                        payload.subs=contacts_l;
                        // Adding this to check in the server whether contact is to be added or not
                        payload.newConnection = 1;
                        console.log(contacts_l);
                    }
                    // Displaying the chat in the sender side
                    document.getElementById(`chats_i_${msg_type}`).innerHTML += `<div class="you chat">${document.getElementById(`msg_${msg_type}`).value}<div>`;
                    document.getElementById(`chats_i_${msg_type}`).scrollTo(0, document.getElementById(`chats_i_${msg_type}`).scrollHeight);
                    // socket.emit('sendMessageClient_sender', payload);
                    // Sending the message to the server for adding it to the database and send it to the receiver(if online) else sstoring in the unread table
                    socket.emit('sendMessageClient', JSON.stringify(payload));
                    document.getElementById(`msg_${msg_type}`).value = "";
                }
        }
        document.getElementById(`msg_${msg_type}`).value = "";
    }

    socket.on('multipleLoginError', ()=>{
        document.body.innerHTML = "Sorry You have logged in another tab";
    });