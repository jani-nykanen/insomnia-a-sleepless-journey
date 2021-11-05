

export class Vector2 {


    public x : number;
    public y : number


	constructor(x = 0.0, y = 0.0) {
		
		this.x = x;
        this.y = y;
	}

	
	public length = () : number => Math.hypot(this.x, this.y);
	
	
	public normalize(forceUnit = false) : Vector2 {
		
		const EPS = 0.0001;
		
		let l = this.length();
		if (l < EPS) {
			
			this.x = forceUnit ? 1 : 0;
            this.y = 0;

			return this.clone();
		}
		
		this.x /= l;
		this.y /= l;
		
		return this.clone();
	}
	
	
	public clone = () : Vector2 => new Vector2(this.x, this.y);


	public zeros() {

        this.x = 0;
        this.y = 0;
	}


	public scalarMultiply(s : number) {

		this.x *= s;
		this.y *= s;
	}


	static dot = (u : Vector2, v : Vector2) : number => u.x*v.x + u.y*v.y;
	

	static normalize = (v : Vector2, forceUnit = false) : Vector2 => v.clone().normalize(forceUnit);
	

	static scalarMultiply = (v : Vector2, s : number) : Vector2 => new Vector2(v.x * s, v.y * s);
	

	static distance = (a : Vector2, b : Vector2) : number => Math.hypot(a.x - b.x, a.y - b.y);


	static direction = (a : Vector2, b : Vector2) : Vector2 => (new Vector2(b.x - a.x, b.y - a.y)).normalize(true);
	

	static add = (a : Vector2, b : Vector2) : Vector2 => new Vector2(a.x + b.x, a.y + b.y);


	static max (v : Vector2, r : number) : Vector2 {

		let out = v.clone();

		if (out.length() > r) {

			out.normalize();
		}
		return out;
	}


	static project = (u : Vector2, v : Vector2) : Vector2 => Vector2.scalarMultiply(v, Vector2.dot(u, v));


	public toVector3XZ = (src : Vector3) : Vector3 => new Vector3(this.x, src.y, this.y);


	static lerp = (a : Vector2, b : Vector2, t : number) : Vector2 => new Vector2(
		(1-t) * a.x + t * b.x,
		(1-t) * a.y + t * b.y);

}


export class Vector3 {


    public x : number;
    public y : number
	public z : number;


	constructor(x = 0.0, y = 0.0, z = 0.0) {
		
		this.x = x;
        this.y = y;
		this.z = z;
	}

	
	public length = () : number => Math.hypot(this.x, this.y, this.z);
	
	
	public normalize(forceUnit = false) : Vector3 {
		
		const EPS = 0.0001;
		
		let l = this.length();
		if (l < EPS) {
			
			this.x = forceUnit ? 1 : 0;
            this.y = 0;
			this.z = 0;

			return this.clone();
		}
		
		this.x /= l;
		this.y /= l;
		this.z /= l;
		
		return this.clone();
	}
	
	
	public clone = () : Vector3 => new Vector3(this.x, this.y, this.z);


	public zeros() {

        this.x = 0;
        this.y = 0;
		this.z = 0;
	}


	public scalarMultiply(s : number) {

		this.x *= s;
		this.y *= s;
		this.z *= s;
	}


	public toVector2XZ = () : Vector2 => new Vector2(this.x, this.z);


	static dot = (u : Vector3, v : Vector3) : number => u.x*v.x + u.y*v.y + u.z*v.z;
	

	static normalize = (v : Vector3, forceUnit = false) : Vector3 => v.clone().normalize(forceUnit);
	

	static scalarMultiply = (v : Vector3, s : number) : Vector3 => new Vector3(v.x * s, v.y * s, v.z * s);
	

	static distance = (a : Vector3, b : Vector3) : number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);


	static direction = (a : Vector3, b : Vector3) : Vector3 => (new Vector3(b.x - a.x, b.y - a.y, b.z - a.z)).normalize(true);


	static add = (a : Vector3, b : Vector3) : Vector3 => new Vector3(a.x + b.x, a.y + b.y, a.z + b.z);


	static cross = (u : Vector3, v : Vector3) => new Vector3(
		u.y * v.z - u.z * v.y,
		-(u.x * v.z - u.z * v.x),
		u.x * v.y - u.y * v.x);

	static lerp = (a : Vector3, b : Vector3, t : number) : Vector3 => new Vector3(
		(1-t) * a.x + t * b.x,
		(1-t) * a.y + t * b.y,
		(1-t) * a.z + t * b.z);
}



export class Rect {

	public x : number;
	public y : number;
	public w : number;
	public h : number;

	constructor(x = 0, y = 0, w = 0, h = 0) {

		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}


	// Don't ask
	public isEqualToOpposite(r : Rect) {

		const EPS = 0.0001;

		if (r == null) return false;

		return (Math.abs(r.x - this.w) < EPS &&
			Math.abs(r.y - this.h) < EPS &&
			Math.abs(r.w - this.x) < EPS &&
			Math.abs(r.h - this.y) < EPS);
	}


	public clone = () : Rect => new Rect(this.x, this.y, this.w, this.h);
}


export class RGBA {

	public r : number;
	public g : number;
	public b : number;
	public a : number;


	constructor(r = 0, g = 0, b = 0, a = 1) {

		this.r = r;
		this.g = g;
		this.b = b;
		this.a = a;
	}


	public clone = () : RGBA => new RGBA(this.r, this.g, this.b, this.a);
}
