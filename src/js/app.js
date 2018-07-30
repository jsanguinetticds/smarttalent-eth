App = {
  web3Provider: null,
  contracts: {},

  init: () => {
    // Load pets.
    $.getJSON('../pets.json', (data) => {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: () => {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },
  initContract: () => {
    $.getJSON('Adoption.json', (data) => {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      const AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });
    

    return App.bindEvents();
  },

  bindEvents: () => {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: async () => {
    try {
      const adoptionInstance = await App.contracts.Adoption.deployed();
      const adopters = await adoptionInstance.getAdopters();
      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    } catch(err) {
      console.log(err.message);
    }
  },

  handleAdopt: (event) => {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));
    try {
      web3.eth.getAccounts(async (err, accounts) => {
        if (err) console.log(error);
        const account = accounts[0];
        
        const adoptionInstance = await App.contracts.Adoption.deployed();
        await adoptionInstance.adopt(petId, {from: account});
        setTimeout(App.markAdopted, 3000);
      });
    } catch(error) {
      console.log(error);
    }
  }
};

$(() => {
  $(window).load(() => {
    App.init();
  });
});
