document.addEventListener("DOMContentLoaded", function() {
    var searchInput = document.getElementById('search-input');
    var searchButton = document.getElementById('search-button');
    var newsList = document.getElementById('news-list');
    var dateInput = document.getElementById('date-input');

    searchButton.addEventListener('click', function() {
        var searchTerm = searchInput.value.trim();
        var selectedDate = dateInput.value;
        console.log(selectedDate)
        if (selectedDate == '') {
            // Set selectedDate to the current date in "YYYY-MM-DD" format
            var today = new Date();
            var year = today.getFullYear();
            var month = (today.getMonth() + 1).toString().padStart(2, '0');
            var day = today.getDate().toString().padStart(2, '0');
            selectedDate = `${year}-${month}-${day}`;
        }

        console.log(selectedDate)

        if (searchTerm !== '' && selectedDate !== '') {
            console.log('hello')
            var url = 'https://newsapi.org/v2/everything?' +
                      'q=' + searchTerm + '&' +
                      'from=' + selectedDate + '&' +
                      'to=' + selectedDate + '&' +
                      'language=en&' +
                      'sortBy=popularity&' +
                      'apiKey=64a17a9ab0ae436a849b031e2f89dd5b';
            console.log(url)
            var req = new Request(url);

            fetch(req)
                .then(function(response) {
                    return response.json();
                })
                .then(function(data) {
                    displayNews(data.articles.slice(0, 5));
                })
                .catch(function(error) {
                    console.log('Error fetching news:', error);
                });
        }
    });

    function displayNews(articles) {
        // Clear previous search results
        newsList.innerHTML = '';

        articles.forEach(function(article) {
            var articleElement = document.createElement('div');
            articleElement.innerHTML = `
                <h2>${article.title}</h2>
                <p>${article.description}</p>
                <a href="${article.url}" target="_blank">Read more</a>
            `;
            newsList.appendChild(articleElement);
        });
    }
});


//https://newsapi.org/v2/everything?q=modi&from=2024-04-18&to=2024-04-18&language=en&sortBy=popularity&apiKey=64a17a9ab0ae436a849b031e2f89dd5b
//https://newsapi.org/v2/everything?q=modi&from=2024-04-21&to=2024-04-21&language=en&sortBy=popularity&apiKey=64a17a9ab0ae436a849b031e2f89dd5b