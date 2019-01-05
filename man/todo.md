
# Testing

    - for performance (particularly joining)
    - for bugs
  
# Features

    - Allow override for explicit join implementation
    - Nested table css (either darker or greater margins)
    - map('*') and print('*') are for all intents and purposes disabled.  
       > Get these working again. 

# Refactors

    - Deal with redundancy of key.size check for inputLiteralizers 
    - Stores bin is a collection of stores as promises (or pretend promises),
       > consider making stores bin a single unified promise if possible.
       > this is significantly impacting 'print' capabilities.
    - Better integrate promise and pretend promise.  
       > Right now you're occasionally checking to see if it's a promise 
         or pretend promise.
       > It seems mostly to do with the need to 'execute' after pretend promsie
         vs the lack of need for this in a standard promise.  

