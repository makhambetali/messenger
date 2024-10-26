document.addEventListener("DOMContentLoaded", () => {
    // Если в localStorage нет данных о комнате или получателе, показываем сообщение
    if (!localStorage.getItem('roomName') || !localStorage.getItem('receiver')) {
        const selectChatMessage = document.getElementById('select-chat-message');
        if (selectChatMessage) {
            selectChatMessage.style.display = 'flex';
        }
    } else {
        if(localStorage.getItem('roomName').includes(window.user.id)){
            fetchMessages(localStorage.getItem('roomName'), localStorage.getItem('receiver'), localStorage.getItem('user_id'));
            document.querySelector("#id_message_send_input").focus();
        }
    }
});

const user = window.user;
const chatLog = document.querySelector("#id_chat_item_container");
const contextMenu = document.querySelector("#context-menu");
var chatSocket = null;
var roomName = null;
let selectedMessageElement = null;
let isEditing = false;
let editingMessageId = null;

async function fetchMessages(roomName, receiver, user_id) {
    // Скрываем сообщение при выборе чата
    const selectChatMessage = document.getElementById('select-chat-message');
    if (selectChatMessage) {
        selectChatMessage.style.display = 'none';
    }

    // Показываем заголовок чата и поле ввода
    document.getElementById('chat-header').classList.remove('hidden');
    document.getElementById('chat-input').classList.remove('hidden');

    const [userId1, userId2] = roomName.split('_').map(Number);
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    roomName = sortedIds.join('_');
    localStorage.setItem("roomName", roomName);
    localStorage.setItem("receiver", receiver);
    localStorage.setItem("user_id", user_id);

    if (document.querySelector('.chosen-user')) {
        document.querySelector('.chosen-user').classList.remove('chosen-user');
    }
    document.querySelector(`a[data-user="${user_id}"]`).classList.add('chosen-user');
    document.querySelector('.receiver').innerHTML = receiver;

    chatSocket = new WebSocket("ws://" + window.location.host + "/ws/chat/" + roomName + "/");
    chatSocket.onopen = function () {
        console.log("The connection was set up successfully!");
    };

    chatSocket.onclose = function () {
        console.log("Connection closed unexpectedly!");
    };

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        if (data.action === "create") {
            const containerDiv = document.createElement('div');
            const messageDiv = document.createElement("div");
            messageDiv.classList.add('message');
            const id = data.id;
            if (data.parent && +data.parent !== -1) {
                const parentDiv = document.createElement('div');
                parentDiv.classList.add("parent-message");
                parentDiv.textContent = document.querySelector(`[data-message-id="${+data.parent}"]`).textContent;
                containerDiv.appendChild(parentDiv);
            }
            if (user.username === data.username) {
                containerDiv.classList.add('user-message');
            } else {
                containerDiv.classList.add('other-message');
            }
            messageDiv.setAttribute('data-message-id', id);
            messageDiv.innerText = data.message;
            document.querySelector("#id_message_send_input").value = "";
            containerDiv.appendChild(messageDiv);
            chatLog.appendChild(containerDiv);
        } else if (data.action === "delete") {
            const messageElement = document.querySelector(`[data-message-id="${data.id}"]`);
            if (messageElement) {
                messageElement.remove();
            }
        } else if (data.action === "edit") {
            const messageElement = document.querySelector(`[data-message-id="${data.id}"]`);
            messageElement.innerText = data.message;
        }
    };

    try {
        const response = await fetch(`/messages/room/${roomName}/`);
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        const messages = await response.json();
        chatLog.innerHTML = ""; // Очистить предыдущие сообщения

        if (messages.length === 0) {
            chatLog.innerHTML = `<div class="no-messages">No messages yet. Start the conversation!</div>`;
        } else {
            renderMessages(messages, chatLog);
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

const sendMessage = (e) => {
    var messageInput = document.querySelector("#id_message_send_input").value;
    roomName = localStorage.getItem("roomName");
    if (messageInput.length != 0) {
        if (isEditing && editingMessageId !== null) {
            // Если сообщение редактируется, отправляем запрос на изменение
            chatSocket.send(JSON.stringify({
                action: "edit",
                messageId: editingMessageId,
                message: messageInput
            }));
            isEditing = false; // Сбрасываем флаг редактирования
            editingMessageId = null; // Очищаем ID сообщения
        } else {
            // Если не редактируем, то отправляем как новое сообщение
            chatSocket.send(JSON.stringify({
                action: "create",
                message: messageInput,
                username: user.username,
                room: roomName,
                parent_id: -1
            }));
        }
        document.querySelector("#id_message_send_input").value = "";
        if(document.querySelector('.no-messages')){
            document.querySelector('.no-messages').style.display = 'none';
        }
        document.querySelector("#id_message_send_input").focus()
    }
}

const editMessage = (e) => {
    e.preventDefault();
    if (selectedMessageElement) {
        const messageId = selectedMessageElement.querySelector('.message').getAttribute('data-message-id');
        const messageText = selectedMessageElement.querySelector('.message').innerText;

        document.querySelector("#id_message_send_input").value = messageText; // Вставляем текст сообщения в поле ввода
        isEditing = true; // Устанавливаем флаг редактирования
        editingMessageId = messageId; // Запоминаем ID сообщения
        contextMenu.style.display = 'none';
        document.querySelector("#id_message_send_input").focus()
    }
}

const deleteMessage = (e) => {
    e.preventDefault();
    if (selectedMessageElement) {
        const messageId = selectedMessageElement.querySelector('.message').getAttribute('data-message-id');
        chatSocket.send(JSON.stringify({
            action: "delete",
            messageId: messageId,
        }));
        selectedMessageElement.remove();
        contextMenu.style.display = 'none';
    }
}

const replyMessage = (e) => {
        e.preventDefault();
        if (selectedMessageElement) {
            const messageId = selectedMessageElement.querySelector('.message').getAttribute('data-message-id');
            roomName = localStorage.getItem("roomName")
            var reply = prompt('Enter your reply to message "' + document.querySelector(`[data-message-id = "${messageId}"]`).innerHTML + '"')
            chatSocket.send(JSON.stringify({
                action:"create",
                message: reply,
                username: user.username,
                room: roomName,
                parent_id: messageId
        }))
        contextMenu.style.display = 'none';
        document.querySelector("#id_message_send_input").focus()
        }
    }
function renderMessages(messages, container) {
    messages.forEach(message => {
        const containerClass = message.username === +user.id ? 'user-message' : 'other-message';
        const containerDiv = document.createElement('div');
        containerDiv.classList.add(containerClass);
        if(message.parent_id){
            const parentDiv = document.createElement('div');
            parentDiv.classList.add("parent-message");
            parentDiv.textContent = document.querySelector(`[data-message-id = "${message.parent_id}"]`).textContent;
            containerDiv.appendChild(parentDiv);
        }
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.innerHTML = message.message;
        messageDiv.setAttribute('data-message-id', message.id);
        containerDiv.appendChild(messageDiv);
        chatLog.appendChild(containerDiv);
    });
}



document.querySelector("#id_message_send_input").onkeyup = function (e) {
    if (e.keyCode === 13) {
        document.querySelector("#id_message_send_button").click();
    }
};

chatLog.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    if (e.target.parentElement.classList.contains('user-message') || e.target.parentElement.classList.contains('other-message')){
        selectedMessageElement = e.target.parentElement;
    } else {
        selectedMessageElement = e.target;
    }
    const rect = e.target.getBoundingClientRect();
    contextMenu.style.top = `${rect.bottom + window.scrollY}px`;
    contextMenu.style.left = `${rect.left + window.scrollX}px`;
    contextMenu.style.display = 'block';
    if (e.target.classList.contains('user-message') || e.target.parentElement.classList.contains('user-message')) {
        contextMenu.innerHTML = 
        '<a href="#" id="reply-message"  onclick="replyMessage(event)">Reply</a><a href="#" id="edit-message" onclick="editMessage(event)">Edit</a><a href="#" id="delete-message" onclick="deleteMessage(event)">Delete</a>';
    } else if(e.target.classList.contains('other-message') || e.target.parentElement.classList.contains('other-message')){
        contextMenu.innerHTML = '<a href="#" id="reply-message" onclick="replyMessage(event)">Reply</a>';
    }
});

document.addEventListener('click', function (e) {
    if (!contextMenu.contains(e.target)) {
        contextMenu.style.display = 'none';
    }
});