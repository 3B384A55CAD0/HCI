Progetto
============

* Vengono fornite alcune collezioni di dati (estese, reali) tipi di dati molto diversi
* Si realizza un'applicazione web per la visualizzazione dei dati. Si utilizzano due librerie:
  - Google chart: <http://code.google.com/apis/chart/interactive/docs/gallery.html>
  - Data-Driven Documents: <http://mbostock.github.com/d3/>
* Test di confronto: per ciascuna collezione di dati si realizzano alcune visualizzazioni diverse e se ne testa efficacia,
  efficienza e soddisfazione con un numero statisticamente significativo di utenti, per identificare caso per caso la più appropriata.
* Si produce un testo di output che documenta il processo seguito
* Si crea una presentazione (PowerPoint, openoffice, PDF, HTML, ecc.) in cui si raccontano le due fasi di progetto:
* Scelta del formato grafico più appropriato
* Fine tuning dei parametri del grafico per ottimizzare la comprensibilità


Come "vendere" il nostro progetto
--------------------------------------

Domande **inutili** per gli utenti:

1. "Sei sicuro di aver capito quanti km ci sono da X a Y?"
2. "Sei sicuro di aver capito quanto costa andare da X a Y?"

Domande **fondamentali** che bisogna porre all'utente:

1. "Sei sicuro di aver capito **come** andare da Bologna a Modena?"
2. "Quanto ti sentiresti sicuro di percorrere il percorso (visualizzato
    una sola volta) a piedi/in auto/in bici, senza poterlo più rivedere 
    e senza avere con te una mappa?"
3. "Quante ulteriori visualizzazioni pensi ti servirebbero per sentirti 
    totalmente sicuro di aver memorizzato l'intero percorso in maniera 
    corretta?"

I dati che mostriamo con DataView sono **nascosti** dentro le immagini
fornite da Google Maps e Google Street View. Il nostro compito è quello
di permettere agli utenti di **notarli più facilmente**, attraverso i
nostri video automatici. Ovvero, quello che facciamo è semplicemente renderli
**naturali** e permettere di essere memorizzati.

Esempi di dati *nascosti*:

* Per quanto devo andare dritto fino alla prossima curva?
* Dove devo girare?
* Come faccio a individuare la traversa corretta ad una intersezione?
* Quali sono i punti di riferimento? Negozi, palazzi, cartelli, colori, 
  fontane, statue, vegetazione, montagne, cose che si vedono in lontananza, 
  ecc.

Inoltre, se devo andare a piedi, i dati da notare e memorizzare dentro
le immagini di Google sono diversi rispetto a quelli che dovrei notare 
e memorizzare se andassi in auto (o addirittura in bici). Ad esempio,
se devo andare in auto potrei anche essere interessato ai seguenti dati:

* Cartelli di divieti ("Dove **non** posso girare?")
* Cartelli dei limiti di velocità
* Cartelli dei sensi unici
* Un'idea del traffico della strada, guardando quante macchine ci sono 
  su Google Street View.

Quindi, se devo andare in macchina o a piedi ho due set di dati diversi.
Quindi, possiamo effettuare due tipologie di test diversi, perché i set
di dati (*nascosti* dentro le immagini di Google) sono diversi.

Infine, per ognuno delle due tipologie di dati, faremo dei test di 
usabilità che cerchino di rispondere alle domande espresse all'inizio.
