document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const animalId = urlParams.get('id');
    const deletarBtn = document.getElementById('deletar-btn');

    if (!animalId) {
        document.getElementById('animal-detalhes-container').innerHTML = '<h2>Animal não especificado.</h2>';
        return;
    }

    // Função para deletar o animal
    const handleDeletarAnimal = () => {
        const tokenDeletar = prompt("Por favor, insira o token de deleção:");

        if (tokenDeletar === null || tokenDeletar.trim() === '') {
            return; // O usuário cancelou ou não inseriu nada
        }

        fetch(`http://localhost:3000/api/animais/${animalId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tokenDeletar: tokenDeletar }),
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.error || 'Erro ao deletar animal.'); });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);
            window.location.href = 'index.html'; // Redireciona para a página inicial
        })
        .catch(error => {
            alert(error.message);
            console.error('Erro ao deletar:', error);
        });
    };

    // Adiciona um ouvinte de evento para o botão de deletar
    deletarBtn.addEventListener('click', handleDeletarAnimal);

    // Fetch do animal para exibir os detalhes
    fetch(`http://localhost:3000/api/animais/${animalId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Animal não encontrado ou erro de servidor.');
            }
            return response.json();
        })
        .then(animal => {
            const container = document.getElementById('animal-detalhes-container');

            const fotosHTML = animal.fotos.map(fotoUrl => `
                <img src="http://localhost:3000${fotoUrl}" alt="Foto do animal">
            `).join('');

            const detalhesHTML = `
                <div class="detalhes-animal">
                    <h2>${animal.nome_animal}</h2>
                    <p><strong>Resgatante:</strong> ${animal.nome_resgatante}</p>
                    <p><strong>Contato:</strong> ${animal.contato}</p>
                    <p><strong>Local:</strong> ${animal.local}</p>
                    <p><strong>Descrição:</strong> ${animal.descricao}</p>
                    <hr>
                    <h3>Galeria de Fotos</h3>
                    <div class="galeria-fotos">
                        ${fotosHTML}
                    </div>
                </div>
            `;
            container.innerHTML = detalhesHTML;
        })
        .catch(error => {
            console.error('Erro ao carregar detalhes:', error);
            document.getElementById('animal-detalhes-container').innerHTML = '<h2>Erro ao carregar os detalhes do animal.</h2>';
        });
});