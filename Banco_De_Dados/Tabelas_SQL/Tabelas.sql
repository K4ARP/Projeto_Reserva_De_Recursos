IF OBJECT_ID('dbo.Usuario', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuario (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        cpf VARCHAR(14) NULL,
        nomeCompleto VARCHAR(150) NULL,
        dataAniversario DATE NULL,
        celular VARCHAR(20) NULL,
        email VARCHAR(150) NULL,
        [login] VARCHAR(50) NULL,
        senha VARCHAR(255) NULL,
        dataCadastro DATETIME NULL DEFAULT GETDATE(),
        dataAcesso DATETIME NULL
    );
END;
GO

IF OBJECT_ID('dbo.Laboratorio', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Laboratorio (
        codigo INT NOT NULL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        capacidade INT NOT NULL CHECK (capacidade > 0),
        localizacao VARCHAR(150) NOT NULL
    );
END;
GO

IF OBJECT_ID('dbo.Sala', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Sala (
        codigo INT NOT NULL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        capacidade INT NOT NULL CHECK (capacidade > 0),
        localizacao VARCHAR(150) NOT NULL
    );
END;
GO

IF OBJECT_ID('dbo.Status', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Status (
        idStatus INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        nomeStatus VARCHAR(30) NOT NULL UNIQUE
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Status WHERE nomeStatus = 'Livre')
    INSERT INTO dbo.Status (nomeStatus) VALUES ('Livre');

IF NOT EXISTS (SELECT 1 FROM dbo.Status WHERE nomeStatus = 'Ocupado')
    INSERT INTO dbo.Status (nomeStatus) VALUES ('Ocupado');

IF NOT EXISTS (SELECT 1 FROM dbo.Status WHERE nomeStatus = 'Bloqueado')
    INSERT INTO dbo.Status (nomeStatus) VALUES ('Bloqueado');

IF NOT EXISTS (SELECT 1 FROM dbo.Status WHERE nomeStatus = 'Reservado')
    INSERT INTO dbo.Status (nomeStatus) VALUES ('Reservado');
GO

IF OBJECT_ID('dbo.Reserva', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reserva (
        idReserva INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        idUsuario INT NOT NULL,
        codigoLaboratorio INT NULL,
        codigoSala INT NULL,
        idStatus INT NOT NULL,
        dataReserva DATE NOT NULL,
        horarioInicio TIME NOT NULL,
        horarioFim TIME NOT NULL,

        CONSTRAINT FK_Reserva_Usuario
            FOREIGN KEY (idUsuario) REFERENCES dbo.Usuario(id),

        CONSTRAINT FK_Reserva_Laboratorio
            FOREIGN KEY (codigoLaboratorio) REFERENCES dbo.Laboratorio(codigo),

        CONSTRAINT FK_Reserva_Sala
            FOREIGN KEY (codigoSala) REFERENCES dbo.Sala(codigo),

        CONSTRAINT FK_Reserva_Status
            FOREIGN KEY (idStatus) REFERENCES dbo.Status(idStatus),

        CONSTRAINT CK_Reserva_UmRecurso
            CHECK (
                (codigoLaboratorio IS NOT NULL AND codigoSala IS NULL)
                OR
                (codigoLaboratorio IS NULL AND codigoSala IS NOT NULL)
            ),

        CONSTRAINT CK_Reserva_Horario
            CHECK (horarioFim > horarioInicio)
    );
END;
GO

USE BD26408;
GO

CREATE TABLE AcessoLogin (
    idAcesso INT IDENTITY(1,1) PRIMARY KEY,
    idUsuario INT NULL,
    dataHora DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    sucesso BIT NOT NULL,
    FOREIGN KEY (idUsuario) REFERENCES Usuario(id)
);
GO
