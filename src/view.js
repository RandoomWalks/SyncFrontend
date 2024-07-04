export const viewUtils = {
    displayData: (data) => {
        const dataDisplay = document.getElementById('dataDisplay');
        dataDisplay.innerHTML = JSON.stringify(data, null, 2);
    },

    displayItem: (data) => {
        const message = document.getElementById('message');
        message.innerText = data.length ? JSON.stringify(data, null, 2) : 'Item not found';
    },

    displayDoc: (data) => {
        const docDisplay = document.getElementById('docDisplay');
        docDisplay.innerHTML = data;
    },

    displayMessage: (data) => {
        const message = document.getElementById('message');
        message.innerText = data;
    },

    displayError: (data) => {
        const message = document.getElementById('message');
        message.innerText = data;
    },
};

// export { viewUtils };
