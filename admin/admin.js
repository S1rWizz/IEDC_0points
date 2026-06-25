function addTeam() {
    const input = document.getElementById('teamInput');
    const teamName = input.value.trim();

    if (teamName === '') {
        alert('Please enter a valid team name.');
        return;
    }

    const ul = document.getElementById('teamList');
    const li = document.createElement('li');
    li.textContent = teamName;
    ul.appendChild(li);

    input.value = ''; // Clear input field
    input.focus();
}

function startQuiz() {
    const teamCount = document.querySelectorAll('#teamList li').length;
    if (teamCount === 0) {
        alert('Please add at least one team before starting.');
        return;
    }
    alert('Starting the quiz with ' + teamCount + ' teams!');
}

// Allow pressing "Enter" key to add a team
document.getElementById('teamInput').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTeam();
    }
});