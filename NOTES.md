# ATEM Controller notes

## SKAARHOJ protocol notes

See http://skaarhoj.com/fileadmin/BMDPROTOCOL.html

- KeBP (get) 20 bytes Keyer Base
    - Can use this to get info on the current configuration of the keyers. I think this is for upstream keyers only?
- CKTp (set) 8 bytes
    - Can use this to set some of the keyer properties.
- CKMs (set) 12 bytes Key Mask
    - This is useful, this is what is used to set the mask (aka cropping) of the key.
- KeDV (get) 60 bytes Key DVE
    - Used to get the DVE paramaters (such as size and position) of an upstream key. We'll need this.
- CKDV (set) 64 bytes Key DVE 
    - This is the money: this is how we set the size and position of an upstream key.
- SSBP (get) 20 bytes Super Source Box Parameters
    - The first half of what we came for: getting Super Source Box parameters.
- CSBP (set) 24 bytes Super Source Box Parameters
    - The second half of what we came for: setting Super Source Box parameters.

## FAQ (aka, notes to self)

### Q: Why aren't DSKs on this list?  
**A:** DSKs can't be re-sized and positioned: they can only be cropped. This isn't very useful for us.
