document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formCadastroAnimal');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        // Cria um objeto FormData para lidar com o upload de arquivos
        const formData = new FormData(this);

        // Envia os dados para a rota de cadastro do backend
        fetch('https://projeto-adote-ja-1.onrender.com/api/animais', {
            method: 'POST',
            body: formData // O FormData lida com o conteúdo e as fotos automaticamente
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor.');
            }
            return response.json();
        })
        .then(data => {
            console.log('Sucesso:', data);
            alert('Animal cadastrado com sucesso!');
            form.reset(); // Limpa o formulário após o sucesso
        })
        .catch((error) => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao cadastrar o animal. Verifique o console para mais detalhes.');
        });
    });
});