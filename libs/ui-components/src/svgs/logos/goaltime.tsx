
export default function Logo({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="467" height="465" fill="none" viewBox="0 0 467 465" className={className}>
      <g clipPath="url(#a)">
        <g>
          <g>
            <mask id="b" width="578" height="531" x="-28" y="-50" maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
              <g>
                <path d="M-28-5h312v486H-28z" className="fill-foreground" />
                <path d="M264 208h286v271H264z" className="fill-foreground" />
                <path d="M196 25.66 271.66-50l68.462 68.46-75.66 75.661z" className="fill-foreground" />
              </g>
            </mask>
            <g mask="url(#b)">
              <circle cx="233.5" cy="232.5" r="207.5" strokeWidth="50" className="stroke-foreground" />
              <path d="M223 208h241.5v50H223v-50Z" className="fill-foreground" />
            </g>
          </g>
          <g>
            <g>
              <path className="fill-foreground" fillRule="evenodd" d="m379.969 123.609.091.091 18.476-55.067-54.822 18.393a183.569 183.569 0 0 1 36.255 36.583Z" clipRule="evenodd"/>
              <path className="fill-foreground" d="m231 218.209 127.21-127.21 17.677 17.678-127.21 127.21z" />
            </g>
            <circle cx="234" cy="233" r="50" className="fill-foreground" />
          </g>
          <g >
            <path className="fill-foreground" d="M79 220h78v25H79z" />
            <path className="fill-foreground" d="M246.5 309v78h-25v-78z" />
            <path className="fill-foreground" d="m184.255 300.678-27.577 27.577L139 310.577 166.577 283z" />
            <path className="fill-foreground" d="m329.255 155.678-27.577 27.577L284 165.577 311.577 138z" />
            <path className="fill-foreground" d="m301.678 283 27.577 27.577-17.678 17.678L284 300.678z" />
            <path className="fill-foreground" d="M166.577 183.255 139 155.678 156.678 138l27.577 27.577z" />
            <path className="fill-foreground" d="M246 78v78h-25V78z" />
          </g>
        </g>
      </g>
      <defs>
        <clipPath id="a">
          <path className="fill-foreground" d="M0 0h467v465H0z"/>
        </clipPath>
      </defs>
    </svg>
  )
}