
'use strict';

var test             = require('selenium-webdriver/testing'),
    application_host = 'http://localhost:3000/',
    until            = require('selenium-webdriver').until,
    By               = require('selenium-webdriver').By,
    expect           = require('chai').expect,
    _                = require('underscore'),
    Promise          = require("bluebird"),
    moment           = require('moment'),
    login_user_func        = require('../lib/login_with_user'),
    register_new_user_func = require('../lib/register_new_user'),
    logout_user_func       = require('../lib/logout_user'),
    open_page_func         = require('../lib/open_page'),
    submit_form_func       = require('../lib/submit_form'),
    check_elements_func    = require('../lib/check_elements'),
    check_booking_func     = require('../lib/check_booking_on_calendar'),
    add_new_user_func      = require('../lib/add_new_user');

/*
 *  Scenario to go in this test:
 *    - Create new company with admin user
 *    - Create new user
 *    - Login as new user
 *    - Submit leave request for new user (that incudes one end to be half)
 *    - Make sure that leve request is shown as a pending one for non admin user
 *    - Submit another leave request that overlaps with previous one,
 *      make sure it failed, cover following cases:
 *      - new request overlap with half by the full end
 *      - new request overlap with full by the half end
 *      - new request overlap with half by the half end
 *
 *   - Successfully submit new request that fits with fist one by the halfs ends
 *
 * */

describe('Overlapping leaverequest (with halfs)', function(){

  // The app is really slow and does not manage to handle request in
  // default 2 seconds, so be more patient.
  this.timeout(90000);

  test.it('Run', function(done){

    var non_admin_user_email, new_user_email;

    // Create new company
    return register_new_user_func({
        application_host : application_host,
    })
    // Create new non-admin user
    .then(function(data){
        new_user_email = data.email;
        return add_new_user_func({
            application_host : application_host,
            driver           : data.driver,
        });
    })
    // Logout from admin acount
    .then(function(data){

        non_admin_user_email = data.new_user_email;

        return logout_user_func({
            application_host : application_host,
            driver           : data.driver,
        });
    })
    // Login as non-admin user
    .then(function(data){
        return login_user_func({
            application_host : application_host,
            user_email       : non_admin_user_email,
            driver           : data.driver,
        });
    })
    // Open calendar page
    .then(function(data){
        return open_page_func({
            url    : application_host + 'calendar/?show_full_year=1&year=2015',
            driver : data.driver,
        });
    })
    // And make sure that it is calendar indeed
    .then(function(data){
      data.driver.getTitle()
        .then(function(title){
            expect(title).to.be.equal('Calendar');
        });
      return Promise.resolve(data);
    })
    // Request new leave
    .then(function(data){
      var driver = data.driver;

      return driver.findElement(By.css('#book_time_off_btn'))
        .then(function(el){
          return el.click();
        })

        // Create new leave request
        .then(function(){

          // This is very important line when working with Bootstrap modals!
          driver.sleep(1000);

          return submit_form_func({
            driver      : driver,
            form_params : [{
                selector        : 'select[name="from_date_part"]',
                option_selector : 'option[value="2"]',
                value           : "2",
            },{
                selector : 'input#from',
                value : '2015-06-16',
            },{
                selector : 'input#to',
                value : '2015-06-17',
            }],
            message : /New leave request was added/,
          });

        })

        // Check that all days are marked as pended
        .then(function(){
          return check_booking_func({
            driver         : driver,
            full_days      : [moment('2015-06-17')],
            halfs_1st_days : [moment('2015-06-16')],
            type           : 'pended',
          });
        });
    })

    // Try to request overlapping leave request (new request overlaps with half by
    // the full end)
    .then(function(data){
      var driver = data.driver;

      return driver.findElement(By.css('#book_time_off_btn'))
        .then(function(el){
          return el.click();
        })

        // Create new leave request
        .then(function(){

          // This is very important line when working with Bootstrap modals!
          driver.sleep(1000);

          return submit_form_func({
            driver      : driver,
            form_params : [{
                selector : 'input#from',
                value : '2015-06-15',
            },{
                selector : 'input#to',
                value : '2015-06-16',
            }],
            message : /Failed to create a leave request/,
          });
        });
    })

    // Try to create new request that overlaps with existing one: new request's
    // half end colides with full part of existing one
    .then(function(data){
      var driver = data.driver;

      return driver.findElement(By.css('#book_time_off_btn'))
        .then(function(el){
          return el.click();
        })

        // Create new leave request
        .then(function(){

          // This is very important line when working with Bootstrap modals!
          driver.sleep(1000);

          return submit_form_func({
            driver      : driver,
            form_params : [{
                selector        : 'select[name="from_date_part"]',
                option_selector : 'option[value="2"]',
                value           : "2",
            },{
                selector : 'input#from',
                value : '2015-06-17',
            },{
                selector : 'input#to',
                value : '2015-06-18',
            }],
            message : /Failed to create a leave request/,
          });
        });
    })

    // Try to create new leave request that colides with existing by halfs
    .then(function(data){
      var driver = data.driver;

      return driver.findElement(By.css('#book_time_off_btn'))
        .then(function(el){
          return el.click();
        })

        // Create new leave request
        .then(function(){

          // This is very important line when working with Bootstrap modals!
          driver.sleep(1000);

          return submit_form_func({
            driver      : driver,
            form_params : [{
                selector        : 'select[name="to_date_part"]',
                option_selector : 'option[value="2"]',
                value           : "2",
            },{
                selector : 'input#from',
                value : '2015-06-15',
            },{
                selector : 'input#to',
                value : '2015-06-16',
            }],
            message : /Failed to create a leave request/,
          });
        });
    })

    .then(function(data){
      var driver = data.driver;

      return driver.findElement(By.css('#book_time_off_btn'))
        .then(function(el){
          return el.click();
        })

        // Create new leave request
        .then(function(){

          // This is very important line when working with Bootstrap modals!
          driver.sleep(1000);

          return submit_form_func({
            driver      : driver,
            form_params : [{
                selector        : 'select[name="to_date_part"]',
                option_selector : 'option[value="3"]',
                value           : "3",
            },{
                selector : 'input#from',
                value : '2015-06-15',
            },{
                selector : 'input#to',
                value : '2015-06-16',
            }],
            message : /New leave request was added/,
          });
        });
    })

    // Check that all days are marked as pended
    .then(function(data){
      return check_booking_func({
        driver    : data.driver,
        full_days : [moment('2015-06-15'),moment('2015-06-16'),moment('2015-06-17')],
        type      : 'pended',
      });
    })

    .then(function(data){ return data.driver.quit(); })
    .then(function(){ done(); });

  }); // End of test.it
});
