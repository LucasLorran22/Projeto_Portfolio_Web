# Guia de Migração Simplificado: Seu MySQL 5 Vai Virar um MySQL 8

Seu banco de dados MySQL 5 está prestes a se mudar para uma casa nova e muito mais moderna: o MySQL 8. Pense nessa mudança como trocar um carro antigo, mas confiável, por um modelo novo, mais rápido, mais seguro e cheio de tecnologia.

A migração é ótima, mas exige atenção, pois a casa nova tem regras diferentes. Este guia vai explicar, de forma simples, o que você precisa saber para que a mudança não quebre nada.

---

## 1. A Nova Casa: Mudanças no "Motor" e nas Ferramentas

O MySQL 8.0 não é só uma atualização; é uma reconstrução do "motor" do banco de dados. Isso significa que ele é mais rápido e mais confiável, mas algumas peças antigas foram trocadas por novas.

### 1.1. O "Catálogo de Endereços" Agora é à Prova de Falhas (Dicionário de Dados Transacional)

Pense no seu banco de dados como uma biblioteca. Ele precisa de um **Catálogo de Endereços** para saber onde estão guardadas todas as tabelas, colunas e regras.

*   **No MySQL 5:** Esse catálogo era como um monte de fichas de papel soltas. Se o sistema caísse no meio de uma mudança, o catálogo podia ficar bagunçado.
*   **No MySQL 8:** O catálogo virou um **sistema de arquivos digital e seguro** (Dicionário de Dados Transacional). Agora, se o sistema cair, ele garante que a mudança foi feita por completo ou não foi feita de jeito nenhum. Isso significa que o banco de dados é muito mais **confiável** e menos propenso a corromper informações internas [1] [2].

### 1.2. A Fila Rápida que Foi Removida (Query Cache)

O *Query Cache* (Cache de Consultas) era como uma "fila rápida" para respostas repetidas. Se você perguntasse a mesma coisa duas vezes, ele dava a resposta na hora, sem ter que procurar de novo.

*   **No MySQL 8:** Essa fila rápida foi **removida**. Por quê? Porque ela causava mais lentidão do que ajudava. Sempre que qualquer dado mudava, a fila inteira tinha que ser apagada, o que travava o sistema [3].
*   **O que fazer:** Agora, o MySQL 8 é tão rápido em procurar que não precisa dessa fila. Se você dependia dela, terá que usar outras técnicas de aceleração, como caches na sua aplicação (ex: Redis).

### 1.3. Novas Ferramentas Inteligentes (Funcionalidades Novas)

O MySQL 8 traz ferramentas novas que facilitam a vida de quem escreve as instruções (o código SQL).

*   **Instruções Mais Limpas (CTEs):** Permite que você quebre uma instrução complexa em pedaços menores e nomeados, como se estivesse escrevendo um rascunho antes da versão final. Isso torna o código mais fácil de ler e manter [4].
*   **Cálculos em Grupo (Funções de Janela):** Permite fazer cálculos avançados, como ranquear clientes ou calcular médias móveis, sem precisar de truques complicados no código. É como ter uma calculadora superpotente embutida [5].

---

## 2. As Regras Mudaram: Incompatibilidades e Sintaxe

O MySQL 8 é mais "caxias" e segue as regras do SQL de forma mais rigorosa. Algumas instruções que funcionavam no MySQL 5 podem parar de funcionar ou dar resultados diferentes.

### 2.1. O "Jeito Certo" de Agrupar Informações (`GROUP BY`)

A mudança mais comum que quebra o código é sobre como você agrupa dados.

*   **No MySQL 5:** Você podia agrupar dados e pedir colunas que não faziam parte do agrupamento. O MySQL tentava adivinhar o que você queria, o que podia levar a erros silenciosos.
*   **No MySQL 8:** Ele exige que você seja **explícito**. Se você agrupa por "Nome do Cliente", só pode pedir colunas que são únicas para aquele nome ou que são resultados de um cálculo (como a soma de pedidos). Se não seguir a regra, ele vai dar um erro [7].

### 2.2. Configurações Padrão Mais Seguras

Muitas configurações internas (variáveis de sistema) mudaram seus valores padrão para aumentar a segurança e a modernidade.

*   **Modo Rígido (`sql_mode`):** O MySQL 8 vem ligado com o modo `STRICT` (Rígido). Isso significa que ele não aceita mais dados "meio errados" (como inserir um texto muito longo em um campo pequeno). Ele vai dar um erro, o que é bom para a qualidade dos seus dados.
*   **Logs Ligados (`log_bin`):** O registro de todas as mudanças (log binário) agora vem **ligado por padrão**. Isso é ótimo para recuperação de desastres, mas pode consumir mais espaço em disco se você não precisar dele.

---

## 3. A Nova "Chave Mestra" de Segurança (Autenticação)

A segurança é uma prioridade no MySQL 8, e a forma como ele verifica quem você é mudou drasticamente.

### 3.1. O Novo Super-Cadeado (`caching_sha2_password`)

A chave que você usa para entrar no banco de dados (o método de autenticação) mudou para um padrão muito mais forte.

*   **No MySQL 5:** Usava-se o `mysql_native_password`, um cadeado mais antigo.
*   **No MySQL 8:** O padrão é o **`caching_sha2_password`**, que usa um algoritmo de criptografia super-forte (SHA-256) [8].

*   **O Problema:** Se você usa um programa ou *driver* de conexão muito antigo, ele pode não reconhecer esse novo cadeado super-forte e vai dizer: "Não consigo abrir essa porta!" [9].

**O que fazer:**

1.  **Ideal:** Atualize todos os seus programas e *drivers* de conexão para versões modernas que entendam o novo cadeado.
2.  **Plano B (Temporário):** Se for impossível atualizar, você pode forçar o MySQL 8 a usar o cadeado antigo (`mysql_native_password`) para usuários específicos. **Mas isso é menos seguro** e deve ser temporário [10].

### 3.2. Gerenciamento de Permissões

O MySQL 8 permite que você crie **"Cargos"** (*Roles*). Em vez de dar permissões (ler, escrever, apagar) para cada pessoa individualmente, você cria um "Cargo de Gerente" ou "Cargo de Leitor" e atribui esse cargo às pessoas. Isso simplifica muito a administração de quem pode fazer o quê [11].

---

## 4. O Idioma Universal dos Dados (UTF8MB4)

O MySQL 8 finalmente adota o **UTF8MB4** como o idioma padrão para armazenar texto.

### 4.1. Por que o UTF8MB4 é Importante?

*   **No MySQL 5:** O padrão antigo (`utf8` ou `utf8mb3`) só conseguia armazenar caracteres que usavam até 3 *bytes*. Isso significa que ele **não conseguia guardar Emojis** 😭, muitos caracteres asiáticos ou símbolos complexos.
*   **No MySQL 8:** O **`utf8mb4`** armazena até 4 *bytes* por caractere. Isso significa que ele é o **verdadeiro UTF-8** e pode guardar qualquer caractere do mundo, incluindo todos os Emojis e símbolos [12].

### 4.2. O que Fazer com Seus Dados Antigos?

Se seus dados antigos usavam o padrão antigo, é altamente recomendado que você os **converta** para `utf8mb4` para evitar que, no futuro, algum Emoji ou símbolo cause um erro ou seja cortado [13].

*   **Atenção:** Como o `utf8mb4` pode usar mais espaço para cada caractere, você precisa verificar se os campos de texto (como `VARCHAR`) que estavam no limite máximo de tamanho ainda caberão.

---

## 5. O Plano de Mudança e as Ferramentas

Você tem duas maneiras de fazer a mudança, e uma ferramenta essencial para verificar se está tudo pronto.

### 5.1. A Ferramenta Essencial: O "Inspetor de Obras"

Antes de tudo, você deve usar o **MySQL Shell Upgrade Checker**. Pense nele como um **Inspetor de Obras** que verifica sua casa antiga (MySQL 5) e aponta tudo o que está errado ou quebrado antes de você começar a mudança.

*   Ele vai te dizer se há variáveis antigas, códigos SQL que vão quebrar ou problemas de segurança. **Corrija tudo o que ele apontar** [14].

### 5.2. Os Dois Tipos de Mudança

| Método | Descrição Simples | Vantagens | Desvantagens |
| :--- | :--- | :--- | :--- |
| **Mudança no Local (In-Place Upgrade)** | Você instala o MySQL 8.0 por cima do 5.x e o próprio sistema faz a conversão dos dados. | É a forma mais **rápida** e exige menos trabalho manual. | É a forma mais **arriscada**. Se algo der errado, é difícil voltar atrás. Só funciona se você estiver no MySQL 5.7 [16]. |
| **Mudar de Casa (Dump & Reload)** | Você copia todos os dados do MySQL 5.x para um arquivo, instala o MySQL 8.0 em um servidor totalmente novo e carrega o arquivo de dados. | É a forma mais **segura**. Se der errado, o servidor antigo continua funcionando. Permite limpar e otimizar os dados no processo. | É a forma mais **lenta**, especialmente para bancos de dados grandes, e exige mais tempo de inatividade. |

---

## Checklist de Preparação para a Mudança

1.  **Backup:** Faça uma cópia de segurança completa e garanta que ela funciona.
2.  **Inspetor de Obras:** Execute o **MySQL Shell Upgrade Checker** e corrija todos os problemas que ele encontrar.
3.  **Configurações:** Verifique seu arquivo de configurações (`my.cnf`) e remova as regras antigas que não existem mais (como as do *Query Cache*).
4.  **Conexões:** Verifique se seus programas e *drivers* de conexão suportam o novo cadeado de segurança (`caching_sha2_password`).
5.  **Código SQL:** Teste seu código SQL mais importante para garantir que ele não quebre com as novas regras de agrupamento (`GROUP BY`).
6.  **Idioma:** Planeje a conversão dos seus dados para o idioma universal **`utf8mb4`**.

---

## As Regras Padrão que Mais Mudaram

| Regra (Variável) | Padrão Antigo (MySQL 5) | Padrão Novo (MySQL 8) | O que Significa |
| :--- | :--- | :--- | :--- |
| **`default_authentication_plugin`** | Cadeado Antigo | Cadeado Super-Forte | **Atenção:** Pode impedir a conexão de programas antigos. |
| **`character_set_server`** | Idioma Antigo | Idioma Universal (`utf8mb4`) | **Atenção:** Garante que Emojis e símbolos funcionem. |
| **`sql_mode`** | Mais Flexível | **Mais Rígido** | O banco de dados não aceita mais dados "meio errados". |
| **`log_bin`** | Desligado | **Ligado** | O registro de mudanças está ativo por padrão. |

---

## Referências (Para quem quiser se aprofundar)

[1] **MySQL 8.0 Reference Manual - What Is New in MySQL 8.0**
[2] **MySQL 8.0 Reference Manual - The Data Dictionary**
[3] **MySQL 8.0 Reference Manual - Query Cache**
[4] **MySQL 8.0 Reference Manual - WITH (Common Table Expressions)**
[5] **MySQL 8.0 Reference Manual - Window Functions**
[7] **MySQL 8.0 Reference Manual - GROUP BY Handling**
[8] **MySQL 8.0 Reference Manual - Caching SHA-2 Pluggable Authentication**
[9] **MySQL 8.0 Reference Manual - Upgrading to MySQL 8.0: Default Authentication Plugin Considerations**
[10] **MySQL 8.0 Reference Manual - ALTER USER Statement**
[11] **MySQL 8.0 Reference Manual - Using Roles**
[12] **MySQL 8.0 Reference Manual - The utf8mb4 Character Set**
[13] **MySQL 8.0 Reference Manual - Converting Between Character Sets**
[14] **MySQL Shell 8.0 - Upgrade Checker Utility**
[16] **MySQL 8.0 Reference Manual - Upgrading from MySQL 5.7 to 8.0**
