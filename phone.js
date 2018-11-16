/**
 * Mask converter for input or output string
 */
class Mask
{
	/**
	 * mask 		{string}	Test mask with format +7(***)***-**-**
	 * source		{string}	Source string, to encode or decode
	 * startFrom 	{number} 	we'll start mask check from this position, all numbers before will be ignored
	 */
	constructor(mask, source, startFrom)
	{
		/**
		 * Stop elements for mask, cursor will follow through this characters
		 */
		this.MASK_STOP = ['+', '-', '(', ')', ' '];
		
		this.mask 	= mask;
		this.source = source;
		this.result = source;		
		this.startFrom = startFrom;
	}
	
	/**
	 * Encodes masked string to source
	 * @returns {instanceof Mask}
	 */
	from()
	{
		
		this.result  = this.result.slice(this.startFrom, this.result.length);

		for (let i = 0; i < this.MASK_STOP.length; i++)
			while(this.result.indexOf(this.MASK_STOP[i])+1)
				this.result =this.result.replace(this.MASK_STOP[i], '');

		return this;
	}
	

	/**
	 * Code source string with applyed masked
	 * @returns {instanceof Mask}
	 */
	to()
	{
		this.result = this.mask;
		
		for (var pos=0, maskpos=0; maskpos < this.mask.length; pos++)
		{
			let char 		= this.mask.charAt(maskpos);
			let sourceChar 	= this.source.charAt(pos);
			
			// Move cursor to first changeable character 
			while(this.MASK_STOP.indexOf(char)>=0 || maskpos <= this.startFrom )
			{	
				char = this.mask.charAt(++maskpos);		
				
				if (maskpos >= this.mask.length)
					break;				
			}

			// Check source char, and insert to result
			while( this.MASK_STOP.indexOf(sourceChar)>=0 )
			{
				sourceChar = this.source.charAt(++pos);
				
				if (pos > this.source.length)
					break;
			}
			
			// Copy to result valid data only
			if (sourceChar >= 0 && sourceChar <= 9)
				this.result = this.result.substr(0,maskpos) + sourceChar + this.result.substr(++maskpos,this.mask.length);
		}
		
		// Resize out data to mask's size
		this.result = this.result.slice(0,this.mask.length);		

		
		return this;
	}
	
	
	toString()
	{
		return this.result.toString();
	}
}


/**
 * Applying phone mask for text input element
 * @author TARiK <tarik@bitstore.ru>
 */
class PhoneMask
{
	/**
	 * element 		{HTMLInputElement} 	Input element to apply mask
	 * mask 		{string} 			Test mask with format +7(***)***-**-**
	 * startFrom 	{number} 			we'll start mask check from this position, all numbers before will be ignored
	 */
	constructor(element, mask, startFrom, defaultValue)
	{
		if (!(element instanceof HTMLInputElement))
			throw new Error('PhoneMask failed: element is not instance of HTMLInputElement.');
				
		this.el 	= element;
		this.mask 	= mask;
		this.result = mask;
		this.startFrom = startFrom;
		
		
		
		if (defaultValue)
		{
			let maskedValue = new Mask(this.mask, defaultValue, startFrom);
			this.result = maskedValue.to().toString();
		}
		
		this.el.value = this.result;
			
		this.el.addEventListener('paste', event=>
		{
			// Prevent default events
			event.preventDefault();
			event.stopPropagation();
		});
				
		this.el.addEventListener('textInput', event => this.keyDownEvent(event));		
		this.el.addEventListener('keydown', event => this.keyDownEvent(event));
		this.el.addEventListener('focus', event => {if (this.result == this.mask) this.setCursorPosition( this.startFrom);});
	}

	
	keyDownEvent(event)
	{
		/**
		 * Stop elements for mask, cursor will follow through this characters
		 */
		const MASK_STOP = ['+', '-', '(', ')', ' '];
		const MASK_PLACEHOLDER  = '_';
		
		// Prevent default events
		event.preventDefault();
		event.stopPropagation();

		if (event.data && !event.key)
			event.key = event.data;

                if (this.result == this.mask)
                 this.setCursorPosition( this.startFrom);

		
		let pos = this.getCursorPosition();
		
		// For some dumbass browsers converts opcodes to characters
		if (!event.key && event.which != 229)
			event.key = String.fromCharCode((96 <= event.which && event.which <= 105) ? event.which-48 : event.which);
		
		// Process cursor movement navigation and clear operations
		if (!(event.key >=0 && event.key <= 9))
		{	
			if (event.key == 'Home' || event.which == 36)
				this.setCursorPosition( this.startFrom);
			else
			if (event.key == 'End' || event.which == 35)
				this.setCursorPosition( this.mask.length );
			else
			if (event.key == 'ArrowLeft' || event.which == 37)					
				this.setCursorPosition( --pos );
			else
			if (event.key == 'ArrowRight' || event.which == 39)
				this.setCursorPosition( ++pos );
			else 
			if (event.key == 'Backspace' || event.which == 8)
			{
				if (pos > this.startFrom)
					this.setCursorPosition( --pos );
				
				if(!(MASK_STOP.indexOf(this.result.charAt(pos)) >= 0))
				{					
					this.result = this.result.substr(0,pos) + MASK_PLACEHOLDER + this.result.substr(pos+1);
					this.el.value = this.result;
					this.setCursorPosition( pos );
				}
			}
			else
			if (event.key == 'Delete'  || event.which == 46)
			{
				if( !(MASK_STOP.indexOf(this.result.charAt(pos)) >= 0))
				{
					this.result = this.result.substr(0,pos) + MASK_PLACEHOLDER + this.result.substr(pos+1);
					this.el.value = this.result;
					this.setCursorPosition( pos );
				}
				
			}
			return;
		}
		
		// Get character from result string at current position
		let char = this.result.charAt(pos);
		
		if (event.which == 229) // Android Chrome etc
		{
			pos--;			
			event.key = char;
			this.result = this.result.substr(0,pos) + this.result.substr(pos+2);
			
			document.getElementById('wrap').innerHTML = char;
			document.getElementById('wrap2').innerHTML = pos;
		}
				
		// Move cursor to first changeable character 
		while(MASK_STOP.indexOf(char)>=0 || pos < this.startFrom )
		{	
			this.setCursorPosition(++pos);
			char = this.result.charAt(pos);
	
			if (pos >= this.result.length)
				break;				
		}
		
		// Check pressed key code, and insert character
		if (event.key >=0 && event.key <= 9) 
			this.result = this.result.substr(0,pos) + event.key + this.result.substr(pos+1);

		
		// Resize input data to mask's size
		this.result = this.result.slice(0,this.mask.length);
					
		this.el.value = this.result;
		this.setCursorPosition(++pos);		
	}
	
	/**
	 * Set cursor position for input
	 * 
	 * pos {number} cursor position
	 */
	setCursorPosition(pos)
	{
		// setSelectionRange BUG fix for android 7 chrome 
		window.clearTimeout(this.tm);
		this.tm = window.setTimeout(()=>{this.el.setSelectionRange(pos,pos)}, 0);		
		
	}
	
	
	/**
	 * Get current cursor position for input
	 * 
	 * @return {number}
	 */
	getCursorPosition()
	{
		return this.result.slice(0, this.el.selectionStart).length;
	}
}
