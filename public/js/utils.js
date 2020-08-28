let searchbar = document.querySelector('#searchbar');

const search = () => {
    if (searchbar !== null) {
        searchbar.oninput = async (e) => {
            if (searchbar.value.charAt(0) === ' ') {
                searchbar.value = '';
            }
            let val = { data: searchbar.value };
            let ul = document.querySelector('#user-search');
            ul.innerHTML = '';
            if (val.data !== null && val.data !== '') {
                const options = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(val),
                };
                const resp = await fetch('/search', options);
                const data = await resp.json();
                data.forEach(element => {
                    let li = document.createElement('li');
                    let a = document.createElement('a');
                    a.setAttribute('href', `/profile/${element}`);
                    li.textContent = element;
                    a.appendChild(li);
                    ul.appendChild(a);
                });
            }
        }
    }
};

search();
