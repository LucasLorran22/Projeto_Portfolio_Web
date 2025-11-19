# Guia Completo de Migração: Do MySQL 5 ao MySQL 8

A migração do MySQL 5 (especialmente 5.7) para o MySQL 8.0 representa um salto significativo, trazendo melhorias de desempenho, segurança e novas funcionalidades. No entanto, essa transição envolve mudanças arquiteturais e incompatibilidades que exigem planejamento e testes rigorosos. Este guia detalha os pontos cruciais para garantir uma migração bem-sucedida.

---

## 1. Mudanças Arquiteturais e Funcionalidades Novas/Removidas

O MySQL 8.0 não é apenas uma atualização, mas uma reescrita substancial de componentes internos, focada em modernização e desempenho [1].

### 1.1. Dicionário de Dados Transacional (Transactional Data Dictionary)

Esta é uma das mudanças arquiteturais mais importantes. No MySQL 5.x, os metadados (informações sobre tabelas, colunas, etc.) eram armazenados em arquivos e tabelas não transacionais (como as tabelas `.frm`).

*   **MySQL 8.0:** O Dicionário de Dados é armazenado em tabelas InnoDB, tornando as operações DDL (Data Definition Language) atômicas e *crash-safe* [2].
*   **Impacto:** Maior confiabilidade e consistência dos metadados. O `INFORMATION_SCHEMA` agora é implementado como *views* sobre o novo Dicionário de Dados.

### 1.2. Funcionalidades Removidas e Descontinuadas

A remoção de funcionalidades antigas é a principal causa de quebra de compatibilidade.

| Funcionalidade | Status no MySQL 8.0 | Impacto na Migração | Referência Oficial |
| :--- | :--- | :--- | :--- |
| **Query Cache** | **Removido** | Se a aplicação dependia do *Query Cache* para desempenho, será necessário reavaliar e otimizar consultas, índices e o uso de *caches* de aplicação (ex: Redis, Memcached) [3]. | [MySQL 8.0 Reference Manual - Query Cache](https://dev.mysql.com/doc/refman/8.0/en/query-cache.html) |
| **Comandos `GRANT` e `REVOKE`** | Sintaxe alterada | A sintaxe para gerenciar usuários e privilégios foi simplificada e modernizada. | [MySQL 8.0 Reference Manual - GRANT Syntax](https://dev.mysql.com/doc/refman/8.0/en/grant.html) |
| **Variáveis de Sistema** | Diversas removidas | Variáveis como `query_cache_size`, `query_cache_type`, `log_slow_admin_statements`, entre outras, foram removidas. Arquivos de configuração (`my.cnf`) devem ser limpos. | [MySQL 8.0 Reference Manual - Removed Features](https://dev.mysql.com/doc/refman/8.0/en/mysql-nutshell.html#mysql-nutshell-removed-features) |

### 1.3. Novas Funcionalidades Cruciais

O MySQL 8.0 introduz recursos que podem simplificar e otimizar o código SQL da sua aplicação.

*   **CTEs (Common Table Expressions):** Permite definir subconsultas nomeadas que podem ser referenciadas dentro de uma instrução `SELECT`, `INSERT`, `UPDATE` ou `DELETE`. Suporta CTEs recursivas, simplificando consultas complexas e hierárquicas [4].
*   **Funções de Janela (Window Functions):** Permite realizar cálculos em um conjunto de linhas relacionadas à linha atual, como ranqueamento, agregação móvel e cálculo de diferenças, sem a necessidade de *self-joins* complexos [5].
*   **JSON Aprimorado:** Novas funções JSON (ex: `JSON_TABLE`) e melhorias de desempenho.
*   **Índices Invisíveis (Invisible Indexes):** Permite desativar temporariamente um índice para testar o impacto de sua remoção no desempenho, sem a necessidade de removê-lo fisicamente [6].

---

## 2. Incompatibilidades e Mudanças de Sintaxe

As incompatibilidades são o maior risco na migração. É fundamental testar a aplicação com o novo servidor.

### 2.1. Mudanças na Sintaxe SQL

| Alteração | MySQL 5.x | MySQL 8.0 | Exemplo de Quebra |
| :--- | :--- | :--- | :--- |
| **Cláusula `ORDER BY` em `GROUP BY`** | Permitido implicitamente | **Exigido explicitamente** | Consultas que usavam `GROUP BY` e dependiam da ordem de inserção ou de um `ORDER BY` implícito podem retornar resultados diferentes ou gerar erro. |
| **Alias de Coluna em `GROUP BY`** | Permitido | **Não permitido** | Não é mais possível usar um *alias* de coluna definido na cláusula `SELECT` dentro da cláusula `GROUP BY` [7]. |
| **Funções de Data/Hora** | `FROM_DAYS(0)` retorna `NULL` | `FROM_DAYS(0)` retorna `0000-00-00` | Mudanças no tratamento de datas inválidas e *zero dates* podem afetar o código da aplicação. |
| **Remoção de `ASC` e `DESC` para `GROUP BY`** | Permitido | **Removido** | A sintaxe `GROUP BY ... ASC/DESC` foi removida. Use `ORDER BY` após o `GROUP BY` para ordenar o resultado. |

### 2.2. Mudanças de Configuração de Sistema (Variáveis)

Muitas variáveis de sistema tiveram seus valores padrão alterados para melhorar a segurança e o desempenho.

*   **`log_bin` (Log Binário):** No MySQL 8.0, o log binário é **habilitado por padrão** em instalações de pacotes (como Debian/Ubuntu), o que não ocorria no 5.7.
*   **`default_authentication_plugin`:** Mudou de `mysql_native_password` para `caching_sha2_password` (ver Seção 3).
*   **`sql_mode`:** O modo padrão inclui `ONLY_FULL_GROUP_BY` e `STRICT_TRANS_TABLES`, que podem quebrar consultas antigas que não seguem o padrão SQL rigoroso.

**Ação Recomendada:** Compare seu arquivo `my.cnf` atual com as configurações padrão do MySQL 8.0. Remova todas as variáveis descontinuadas e ajuste as que tiveram o valor padrão alterado.

---

## 3. Segurança e Usuários

O MySQL 8.0 traz melhorias significativas de segurança, sendo a mudança no sistema de autenticação a mais crítica para a migração.

### 3.1. Plugin de Autenticação Padrão: `caching_sha2_password`

O plugin padrão mudou de `mysql_native_password` (usado no MySQL 5.x) para **`caching_sha2_password`** [8].

*   **Vantagens:** Usa o algoritmo de *hashing* SHA-256, muito mais seguro que o SHA-1 do plugin antigo.
*   **Incompatibilidade:** Clientes e *drivers* de conexão antigos (ex: PHP 5.x, *drivers* JDBC ou ODBC desatualizados) podem **não suportar** o novo plugin, resultando em erros de conexão como: "Authentication plugin 'caching_sha2_password' cannot be loaded" [9].

**Soluções para Incompatibilidade:**

1.  **Recomendado:** Atualize todos os *drivers* e bibliotecas de conexão da aplicação para versões compatíveis com o MySQL 8.0.
2.  **Alternativa (Temporária):** Altere o plugin de autenticação para usuários específicos ou globalmente para `mysql_native_password` (desaconselhado a longo prazo) [10]:

    ```sql
    -- Para um usuário específico
    ALTER USER 'user'@'host' IDENTIFIED WITH mysql_native_password BY 'password';

    -- Globalmente (adicionar ao my.cnf)
    [mysqld]
    default_authentication_plugin=mysql_native_password
    ```

### 3.2. Políticas de Senha e Gerenciamento de Usuários

*   **Funções de Role:** O MySQL 8.0 introduziu o conceito de *Roles* (funções), permitindo agrupar privilégios e atribuí-los a usuários, simplificando o gerenciamento de permissões [11].
*   **Melhorias em `mysql.user`:** As tabelas de sistema de privilégios foram reescritas, e o gerenciamento de senhas e expiração foi aprimorado.

---

## 4. Conjunto de Caracteres e Collation

O MySQL 8.0 adota o **UTF8MB4** como o conjunto de caracteres padrão, o que é uma melhoria significativa para a compatibilidade global de dados.

### 4.1. O Novo Padrão UTF8MB4

*   **MySQL 5.x:** O padrão era frequentemente `latin1` ou `utf8` (que na verdade era `utf8mb3`, suportando no máximo 3 *bytes* por caractere).
*   **MySQL 8.0:** O padrão é **`utf8mb4`** com a *collation* **`utf8mb4_0900_ai_ci`** [12].
    *   **`utf8mb4`:** Suporta até 4 *bytes* por caractere, o que é o padrão real do UTF-8 e permite armazenar *emojis*, caracteres asiáticos complexos e símbolos matemáticos.
    *   **`utf8mb4_0900_ai_ci`:** É uma *collation* moderna, baseada no Unicode Collation Algorithm (UCA) 9.0.0, que oferece ordenação e comparação de *strings* mais precisas e sensíveis à cultura.

### 4.2. Implicações e Conversão

Se sua base de dados no MySQL 5.x já usa `utf8` (ou `utf8mb3`), a conversão para `utf8mb4` é altamente recomendada para evitar problemas de codificação e truncamento de dados [13].

**Processo de Conversão (Recomendado):**

1.  **Backup:** Faça um *dump* completo da base de dados.
2.  **Conversão de Esquema:** Altere o conjunto de caracteres do banco de dados, tabelas e colunas de *strings* (CHAR, VARCHAR, TEXT) para `utf8mb4` e a *collation* para `utf8mb4_0900_ai_ci`.

    ```sql
    -- Exemplo de alteração de banco de dados
    ALTER DATABASE db_name CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

    -- Exemplo de alteração de tabela e colunas
    ALTER TABLE table_name CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
    ```

3.  **Ajuste de Tamanho:** Lembre-se de que `utf8mb4` usa mais espaço (até 4 *bytes* por caractere). Se você tiver colunas `VARCHAR` ou `CHAR` com o tamanho máximo permitido, a conversão pode falhar se o tamanho da linha exceder o limite do InnoDB.

---

## 5. Processo de Upgrade e Ferramentas

Existem dois métodos principais para o *upgrade*, e ferramentas específicas devem ser usadas para verificar a compatibilidade.

### 5.1. Ferramentas de Pré-Migração

*   **MySQL Shell Upgrade Checker (`util.checkForServerUpgrade()`):** Esta é a ferramenta **mais importante** para a pré-migração. Ela verifica o servidor MySQL 5.7 (ou anterior) em busca de incompatibilidades conhecidas com o MySQL 8.0, como *triggers* inválidos, nomes de objetos reservados, variáveis de sistema obsoletas e problemas de Dicionário de Dados [14].

    ```bash
    # Exemplo de uso no MySQL Shell
    mysqlsh root@localhost:3306 -- util.checkForServerUpgrade()
    ```

### 5.2. Métodos de Upgrade

| Método | Descrição | Vantagens | Desvantagens |
| :--- | :--- | :--- | :--- |
| **In-Place Upgrade** | Instalar o MySQL 8.0 sobre a instalação existente do 5.x e executar o utilitário de *upgrade* (`mysql_upgrade` ou o processo automático do servidor 8.0). | Mais rápido, menos complexo. | Mais arriscado, difícil de reverter, exige que a versão anterior seja 5.7. |
| **Dump & Reload (Lógico)** | Fazer um *dump* lógico completo da base de dados 5.x (`mysqldump` ou MySQL Shell *Dump Utility*), instalar o MySQL 8.0 em um novo servidor e carregar o *dump*. | Mais seguro, fácil de reverter, permite a limpeza e otimização do esquema. | Mais lento (especialmente para grandes bases de dados), exige mais espaço em disco e tempo de inatividade. |

**Nota:** O utilitário `mysql_upgrade` foi descontinuado no MySQL 8.0.16 e suas funções foram integradas ao processo de inicialização do servidor [15].

---

## Checklist de Pré-Migração

Antes de iniciar o *upgrade*, siga esta lista de verificação para minimizar riscos:

1.  **Backup Completo:** Garanta um *dump* lógico e/ou físico completo e testado da base de dados 5.x.
2.  **Upgrade para 5.7 (Se Necessário):** Se você estiver em uma versão anterior ao 5.7, **deve** primeiro migrar para o MySQL 5.7, pois o *upgrade* direto para o 8.0 é suportado apenas a partir do 5.7 [16].
3.  **Executar o Upgrade Checker:** Use o `util.checkForServerUpgrade()` do MySQL Shell para identificar e corrigir todas as incompatibilidades.
4.  **Revisar `my.cnf`:** Remova variáveis descontinuadas (ex: `query_cache_size`) e ajuste variáveis com novos padrões (ex: `log_bin`).
5.  **Testar Aplicação:** Verifique a compatibilidade dos *drivers* de conexão com `caching_sha2_password`.
6.  **Revisar SQL:** Identifique e corrija consultas que usam `GROUP BY` sem `ORDER BY` explícito ou que usam *aliases* de coluna em `GROUP BY`.
7.  **Considerar UTF8MB4:** Planeje a conversão do conjunto de caracteres para `utf8mb4` (idealmente antes ou logo após o *upgrade*).

---

## Variáveis de Sistema com Mudança de Valor Padrão (Exemplos Chave)

| Variável de Sistema | Valor Padrão no MySQL 5.7 | Valor Padrão no MySQL 8.0 | Impacto |
| :--- | :--- | :--- | :--- |
| **`default_authentication_plugin`** | `mysql_native_password` | `caching_sha2_password` | **CRÍTICO:** Pode quebrar a conexão de clientes antigos. |
| **`character_set_server`** | `latin1` (ou `utf8`) | `utf8mb4` | **CRÍTICO:** Afeta o armazenamento de novos dados e a compatibilidade com *emojis*. |
| **`collation_server`** | `latin1_swedish_ci` | `utf8mb4_0900_ai_ci` | Nova *collation* baseada em UCA 9.0.0. |
| **`sql_mode`** | `NO_ENGINE_SUBSTITUTION` | `ONLY_FULL_GROUP_BY, STRICT_TRANS_TABLES, ...` | O modo rigoroso pode quebrar consultas SQL não conformes. |
| **`log_bin`** | Desabilitado | Habilitado | Pode aumentar o uso de disco se não for explicitamente desabilitado. |

---

## Referências

[1] **MySQL 8.0 Reference Manual - What Is New in MySQL 8.0**
[2] **MySQL 8.0 Reference Manual - The Data Dictionary**
[3] **MySQL 8.0 Reference Manual - Query Cache**
[4] **MySQL 8.0 Reference Manual - WITH (Common Table Expressions)**
[5] **MySQL 8.0 Reference Manual - Window Functions**
[6] **MySQL 8.0 Reference Manual - Invisible Indexes**
[7] **MySQL 8.0 Reference Manual - GROUP BY Handling**
[8] **MySQL 8.0 Reference Manual - Caching SHA-2 Pluggable Authentication**
[9] **MySQL 8.0 Reference Manual - Upgrading to MySQL 8.0: Default Authentication Plugin Considerations**
[10] **MySQL 8.0 Reference Manual - ALTER USER Statement**
[11] **MySQL 8.0 Reference Manual - Using Roles**
[12] **MySQL 8.0 Reference Manual - The utf8mb4 Character Set**
[13] **MySQL 8.0 Reference Manual - Converting Between Character Sets**
[14] **MySQL Shell 8.0 - Upgrade Checker Utility**
[15] **MySQL 8.0 Reference Manual - mysql_upgrade**
[16] **MySQL 8.0 Reference Manual - Upgrading from MySQL 5.7 to 8.0**
