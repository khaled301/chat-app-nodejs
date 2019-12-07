const socket = io();

//elements from DOM => $
const $form = document.getElementById('message_form');
const $formSubmitBtn = document.getElementById('submit_btn');
const $locationBtn = document.getElementById('location_btn');
const $messages = document.getElementById('messages');
const $chatSidebar = document.getElementById('chat_sidebar');

//Template
const $messageTemplate = document.getElementById('message_template').innerHTML;
const $locationTemplate = document.getElementById('location_template').innerHTML;
const $sidebarTemplate = document.getElementById('sidebar_template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {

    //New message element
    const $newMessage = $messages.lastElementChild;

    //Get newMessage styles  => margin using browser getComputedStyle()
    const newMessageStyles = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);

    //Height of the new message
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    //visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of messages container
    const containerHeight = $messages.scrollHeight;

    //How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }

    // console.log(newMessageMargin);
};

$form.addEventListener('submit', (e) => {

    e.preventDefault();

    $formSubmitBtn.setAttribute('disabled', 'disabled');

    let inputMessage = e.target.elements.input_message;

    //event name, message/value, acknowledgement
    socket.emit('sendInputMessage', inputMessage.value, (error) => {

        $formSubmitBtn.removeAttribute('disabled');
        inputMessage.value = '';
        inputMessage.focus();

        if (error) {
            return console.log(error);
        }
        console.log(`The message was delivered.`);
    });
});

socket.on('welcomeMessage', (msgContent) => {

    console.log(msgContent);
    const html = Mustache.render($messageTemplate, {
        username: msgContent.username,
        message: msgContent.text,
        createdAt: moment(msgContent.createdAt).format('h:mm:s a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();

});

socket.on('message', (msgContent)=> {

    console.log(msgContent);
    const html = Mustache.render($messageTemplate, {
        username: msgContent.username,
        message: msgContent.text,
        createdAt: moment(msgContent.createdAt).format('h:mm:s a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();

});

socket.on('locationMessage', ( { username, locationURL, newLocationURL, createdAt })=> {

    console.log(locationURL);

    const html = Mustache.render($locationTemplate, {
        username,
        locationURL,
        newLocationURL,
        locationCreatedAt: moment(createdAt).format('h:mm:s a')
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();

});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render($sidebarTemplate, {
        room,
        users
    });
    $chatSidebar.innerHTML = html;
});

$locationBtn.addEventListener('click', () => {

    if (!navigator.geolocation) {
        return alert('Sorry, Geolocation is not supported by your browser.');
    }

    $locationBtn.setAttribute('disabled', 'disabled');

    //getCurrentPosition() is Asynchronous but unfortunately currently does not support Promise
    navigator.geolocation.getCurrentPosition((position) => {
        const locationCoords = {
            lat: position.coords.latitude,
            long: position.coords.longitude
        } ;
        socket.emit('sendLocation', locationCoords, (acknowledgement) => {
            $locationBtn.removeAttribute('disabled');
            console.log(acknowledgement);
        });
    });

});

socket.emit('join', {username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});