App = {
  web3Provider: null,
  contracts: {},
  names: [],
  url: 'http://127.0.0.1:7545',
  // network_id: 5777,
  chairPerson: null,
  currentAccount: null,
  biddingPhases: {
    "AuctionInit": { 'id': 0, 'text': "Bidding Not Started" },
    "BiddingStarted": { 'id': 1, 'text': "Bidding Started" },
    "RevealStarted": { 'id': 2, 'text': "Reveal Started" },
    "AuctionEnded": { 'id': 3, 'text': "Auction Ended" }
  },
  auctionPhases: {
    "0": "Bidding Not Started",
    "1": "Bidding Started",
    "2": "Reveal Started",
    "3": "Auction Ended"
  },

  init: function () {
    console.log("Checkpoint 0");
    return App.initWeb3();
  },

  initWeb3: function () {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fallback to the TestRPC
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    ethereum.enable();
    App.populateAddress();
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('BlindAuction.json', function (data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      App.contracts.vote = TruffleContract(data);
      App.contracts.mycontract = data;
      // Set the provider for our contract
      App.contracts.vote.setProvider(App.web3Provider);
      App.currentAccount = web3.eth.coinbase;
      jQuery('#current_account').text(App.currentAccount);
      App.getCurrentPhase();
      App.getChairperson();
      return App.bindEvents();
    });
  },

  bindEvents: function () {
    $(document).on('click', '#submit-bid', App.handleBid);
    $(document).on('click', '#change-phase', App.handlePhase);
    $(document).on('click', '#generate-winner', App.handleWinner);
    $(document).on('click', '#submit-reveal', App.handleReveal);
    $(document).on('click', '#close-auction', App.handleClose);
    $(document).on('click', '#withdraw-bid', App.handleWithdraw);

    //$(document).on('click', '#register', function(){ var ad = $('#enter_address').val(); App.handleRegister(ad); });
  },

  populateAddress: function () {
    new Web3(new Web3.providers.HttpProvider(App.url)).eth.getAccounts((err, accounts) => {
      jQuery.each(accounts, function (i) {
        if (web3.eth.coinbase !== accounts[i]) {
          const optionElement = '<option value="' + accounts[i] + '">' + accounts[i] + '</option';
          jQuery('#enter_address').append(optionElement);
        }
      });
    });
  },

  getCurrentPhase: function() {
    App.contracts.vote.deployed().then(function(instance) {
      return instance.currentPhase({from: App.currentAccount});
    }).then(function(result) {
      App.currentPhase = result;
      const notificationText = App.auctionPhases[App.currentPhase];
      console.log(App.currentPhase);
      console.log(notificationText);
      $('#phase-notification-text').text(notificationText);
      console.log("Phase set");
    })
  },

  getChairperson: function() {
    App.contracts.vote.deployed().then(function(instance) {
      return instance.beneficiary({from: App.currentAccount});
    }).then(function(result) {
      App.chairPerson = result;
      console.log('init chairperson:    ' + App.chairPerson);
      console.log('init currentAccount: ' + App.currentAccount);
      console.log('init phase:          ' + App.currentPhase);
      if(App.currentAccount === App.chairPerson) {
        $(".chairperson").css("display", "inline");
        $(".img-chairperson").css("width", "100%").removeClass("col-lg-offset-2");
      } else {
        $(".other-user").css("display", "inline");
      }
    })
  },

  handlePhase: function () {
    App.contracts.vote.deployed().then(function (instance) {
      console.log("handlePhase called");
      return instance.advancePhase({from: App.currentAccount});
    })
      .then(function (result) {
        console.log(result);
        if (result) {
          if (parseInt(result.receipt.status) === 1) {
            if (result.logs.length > 0) {
              App.showNotification(result.logs[0].event);
            }
            else {
              App.showNotification("AuctionEnded");
            }
            App.contracts.vote.deployed().then(function(latestInstance) {
              return latestInstance.currentPhase({from: App.currentAccount});
            }).then(function(result) {
              console.log("This is also working, new phase updated")
              App.currentPhase = result;
            })
          }
          else {
            console.log("handle phase error 1");
            toastr["error"]("Error in changing to next Event");
          }
        }
        else {
          console.log("handle phase error 2");
          toastr["error"]("Error in changing to next Event");
        }
      })
      .catch(function (err) {
        console.log("handle phase err 3");
        console.log(err);
        toastr["error"]("Error in changing to next Event");
      });
  },

  handleBid: function (event) {
    event.preventDefault();
    const bidValue = $("#bet-value").val();
    const msgValue = $("#message-value").val();
    web3.eth.getAccounts(function () {
      App.contracts.vote.deployed().then(function (instance) {
        return instance.bid(bidValue, { from: App.currentAccount, value: web3.toWei(msgValue, "ether") });
      }).then(function (result) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) === 1)
            toastr.info("Your Bid is Placed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Bidding. Bidding Reverted!");
        } else {
          toastr["error"]("Bidding Failed!");
        }
      }).catch(function () {
        toastr["error"]("Bidding Failed!");
      });
    });
  },

  handleReveal: function (event) {
    console.log("button clicked");
    event.preventDefault();
    const bidRevealValue = $("#bet-reveal").val();
    console.log(parseInt(bidRevealValue));
    const bidRevealSecret = $("#password").val();
    web3.eth.getAccounts(function () {
      App.contracts.vote.deployed().then(function (instance) {
        return instance.reveal(parseInt(bidRevealValue), bidRevealSecret, {from: App.currentAccount});
      }).then(function (result) {
        if (result) {
          console.log(result.receipt.status);
          if (parseInt(result.receipt.status) === 1)
            toastr.info("Your Bid is Revealed!", "", { "iconClass": 'toast-info notification0' });
          else
            toastr["error"]("Error in Revealing. Bidding Reverted!");
        } else {
          toastr["error"]("Revealing Failed!");
        }
      }).catch(function () {
        toastr["error"]("Revealing Failed!");
      });
    });
  },


  handleWinner: function () {
    console.log("To get winner");
    let bidInstance;
    App.contracts.vote.deployed().then(function (instance) {
      bidInstance = instance;
      return bidInstance.auctionEnd({from: App.currentAccount});
    }).then(function (res) {
      console.log(res);
      const winner = res.logs[0].args.winner;
      const highestBid = res.logs[0].args.highestBid.toNumber();
      toastr.info("Highest bid is " + highestBid + "<br>" + "Winner is " + winner, "", { "iconClass": 'toast-info notification3' });
    }).catch(function (err) {
      console.log(err.message);
      toastr["error"]("Error!");
    })
  },

  handleWithdraw: function() {
    if(App.currentPhase === 3) {
      console.log("Inside handleWithdraw")
      App.contracts.vote.deployed().then(function(instance) {
        console.log("Trying to call withdraw with currentAccount: " + App.currentAccount);
        return instance.withdraw({from: App.currentAccount});
      }).then(function(result) {
        if(result.receipt.status) {
          toastr.info('Your bid has been withdrawn');
        }  
      }).catch(function(err) {
        console.log(err.message);
        toastr["error"]("Error in withdrawing the bid");
      })
    } else {
      toastr["error"]("Not in a valid phase to withdraw bid!");
    }
  },

  handleClose: function() {
    if(App.currentPhase === 3) {
      console.log("this worked");
      App.contracts.vote.deployed().then(function(instance) {
        return instance.closeAuction({from: App.currentAccount})
      }).then(function(result) {
        if(result.receipt.status) {
          toastr["error"]("Auction is closed!");
        }
      })
    } else {
      toastr["error"]("Not in a valid phase to close the auction!");
    }
  },

  //Function to show the notification of auction phases
  showNotification: function (phase) {
    const notificationText = App.biddingPhases[phase];
    $('#phase-notification-text').text(notificationText.text);
    toastr.info(notificationText.text, "", { "iconClass": 'toast-info notification' + String(notificationText.id) });
  }
};


$(function () {
  $(window).load(function () {
    App.init();
    //Notification UI config
    toastr.options = {
      "showDuration": "1000",
      "positionClass": "toast-top-left",
      "preventDuplicates": true,
      "closeButton": true
    };
  });
});
